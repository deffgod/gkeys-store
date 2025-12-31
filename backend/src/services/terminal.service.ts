import prisma from '../config/database.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AppError } from '../middleware/errorHandler.js';
import { convertCurrency, processTerminalWebhook } from './payment.service.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sendBalanceTopUpEmail } from './email.service';

// Terminal transaction formats
interface ParsedTransaction {
  transactionId: string;
  email: string;
  name?: string;
  surname?: string;
  amount: number;
  currency: string;
  method: string;
  timestamp: Date;
  rawData: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TerminalBankStatement {
  accountNumber: string;
  bankName: string;
  statementDate: Date;
  transactions: {
    date: string;
    description: string;
    amount: number;
    currency: string;
    reference?: string;
    senderName?: string;
    senderAccount?: string;
  }[];
}

// Regular expressions for parsing different formats
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
const AMOUNT_REGEX = /(\d+[.,]?\d*)\s*(EUR|PLN|USD|GBP)?/i;
const NAME_REGEX = /(?:od|from|nadawca)[\s:]+([A-ZŁŚŻŹĆĄĘÓŃa-złśżźćąęóń\s]+)/i;

/**
 * Parse email from transaction description
 */
const extractEmail = (text: string): string | null => {
  const match = text.match(EMAIL_REGEX);
  return match ? match[1].toLowerCase() : null;
};

/**
 * Parse amount from transaction description
 */
const extractAmount = (text: string): { amount: number; currency: string } | null => {
  const match = text.match(AMOUNT_REGEX);
  if (!match) return null;

  const amount = parseFloat(match[1].replace(',', '.'));
  const currency = match[2]?.toUpperCase() || 'PLN';

  return { amount, currency };
};

/**
 * Parse sender name from transaction description
 */
const extractName = (text: string): { firstName?: string; lastName?: string } => {
  const match = text.match(NAME_REGEX);
  if (!match) return {};

  const nameParts = match[1].trim().split(/\s+/);
  if (nameParts.length >= 2) {
    return {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
    };
  }
  return { firstName: nameParts[0] };
};

/**
 * Parse a single transaction line (CSV, MT940, etc.)
 */
export const parseTransactionLine = (
  line: string,
  _format: string = 'generic'
): ParsedTransaction | null => {
  try {
    // Remove extra whitespace
    const cleanLine = line.trim().replace(/\s+/g, ' ');

    // Extract email (required)
    const email = extractEmail(cleanLine);
    if (!email) {
      console.log('[Terminal] No email found in transaction:', cleanLine.substring(0, 50));
      return null;
    }

    // Extract amount (required)
    const amountData = extractAmount(cleanLine);
    if (!amountData || amountData.amount <= 0) {
      console.log('[Terminal] No valid amount found in transaction');
      return null;
    }

    // Extract name (optional)
    const nameData = extractName(cleanLine);

    // Generate unique transaction ID
    const transactionId = `TRM-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    return {
      transactionId,
      email,
      name: nameData.firstName,
      surname: nameData.lastName,
      amount: amountData.amount,
      currency: amountData.currency,
      method: 'TERMINAL',
      timestamp: new Date(),
      rawData: cleanLine,
    };
  } catch (error) {
    console.error('[Terminal] Error parsing transaction line:', error);
    return null;
  }
};

/**
 * Parse CSV bank statement
 */
export const parseCSVStatement = (
  csvContent: string,
  _columnMapping?: {
    date?: number;
    description?: number;
    amount?: number;
    currency?: number;
    reference?: number;
  }
): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];
  const lines = csvContent.split('\n').filter((l) => l.trim());

  // Skip header row
  const dataLines = lines.slice(1);

  for (const line of dataLines) {
    const parsed = parseTransactionLine(line);
    if (parsed) {
      transactions.push(parsed);
    }
  }

  return transactions;
};

/**
 * Parse MT940 bank statement format
 */
export const parseMT940Statement = (mt940Content: string): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];

  // MT940 transaction records start with :61:
  const transactionBlocks = mt940Content.split(':61:').slice(1);

  for (const block of transactionBlocks) {
    const lines = block.split('\n');
    const transactionLine = lines[0] || '';
    const descriptionLine = lines.find((l) => l.startsWith(':86:'))?.substring(4) || '';

    const fullText = `${transactionLine} ${descriptionLine}`;
    const parsed = parseTransactionLine(fullText, 'mt940');

    if (parsed) {
      transactions.push(parsed);
    }
  }

  return transactions;
};

/**
 * Process parsed transactions - add balance to users
 */
export const processParsedTransactions = async (
  transactions: ParsedTransaction[]
): Promise<{
  processed: number;
  skipped: number;
  errors: string[];
}> => {
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const tx of transactions) {
    try {
      // Check if transaction already processed
      const existingTx = await prisma.transaction.findFirst({
        where: {
          OR: [
            { transactionHash: tx.transactionId },
            {
              AND: [
                { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                { user: { email: tx.email } },
                { amount: convertCurrency(tx.amount, tx.currency, 'EUR') },
              ],
            },
          ],
        },
      });

      if (existingTx) {
        console.log('[Terminal] Skipping duplicate transaction:', tx.transactionId);
        skipped++;
        continue;
      }

      // Process the transaction
      await processTerminalWebhook({
        transactionId: tx.transactionId,
        email: tx.email,
        name: tx.name,
        surname: tx.surname,
        amount: tx.amount,
        currency: tx.currency,
        method: tx.method,
        status: 'completed',
        timestamp: tx.timestamp.toISOString(),
      });

      processed++;
      console.log('[Terminal] Processed transaction:', {
        id: tx.transactionId,
        email: tx.email,
        amount: tx.amount,
        currency: tx.currency,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${tx.transactionId}: ${errorMsg}`);
      console.error('[Terminal] Error processing transaction:', error);
    }
  }

  return { processed, skipped, errors };
};

/**
 * Process bank statement file
 */
export const processBankStatement = async (
  content: string,
  format: 'csv' | 'mt940' | 'generic' = 'generic'
): Promise<{
  total: number;
  processed: number;
  skipped: number;
  errors: string[];
}> => {
  let transactions: ParsedTransaction[];

  switch (format) {
    case 'csv':
      transactions = parseCSVStatement(content);
      break;
    case 'mt940':
      transactions = parseMT940Statement(content);
      break;
    default:
      // Try to parse each line
      transactions = content
        .split('\n')
        .map((line) => parseTransactionLine(line))
        .filter((tx): tx is ParsedTransaction => tx !== null);
  }

  const result = await processParsedTransactions(transactions);

  return {
    total: transactions.length,
    ...result,
  };
};

/**
 * Validate terminal webhook hash
 */
export const validateTerminalHash = (
  data: Record<string, unknown>,
  receivedHash: string,
  secretKey: string
): boolean => {
  // Create hash from data + secret
  const crypto = require('crypto');
  const sortedKeys = Object.keys(data).sort();
  const stringToHash = sortedKeys.map((k) => `${k}=${data[k]}`).join('&') + secretKey;
  const expectedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');

  return expectedHash === receivedHash;
};

/**
 * Get terminal transaction statistics
 */
export const getTerminalStats = async (): Promise<{
  totalTransactions: number;
  totalAmount: number;
  todayTransactions: number;
  todayAmount: number;
  uniqueUsers: number;
}> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalData, todayData] = await Promise.all([
    prisma.transaction.aggregate({
      where: { method: 'TERMINAL' },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        method: 'TERMINAL',
        createdAt: { gte: today },
      },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const uniqueUsers = await prisma.transaction.groupBy({
    by: ['userId'],
    where: { method: 'TERMINAL' },
  });

  return {
    totalTransactions: totalData._count,
    totalAmount: Number(totalData._sum.amount || 0),
    todayTransactions: todayData._count,
    todayAmount: Number(todayData._sum.amount || 0),
    uniqueUsers: uniqueUsers.length,
  };
};
