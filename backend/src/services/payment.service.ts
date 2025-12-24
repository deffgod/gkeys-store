import prisma from '../config/database.js';
import { BalanceTopUpRequest, PaymentIntent, PaymentWebhook, TerminalWebhook } from '../types/payment.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendBalanceTopUpEmail } from './email.service.js';
import { createStripeRefund } from './stripe.service.js';
import { createPayPalRefund } from './paypal.service.js';
import { createMollieRefund } from './mollie.service.js';

// Currency conversion rates (EUR to other currencies)
const CURRENCY_RATES: Record<string, number> = {
  EUR: 1.0,
  PLN: 4.3,
  USD: 1.1,
  GBP: 0.85,
};

export const convertCurrency = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  const fromRate = CURRENCY_RATES[from] || 1.0;
  const toRate = CURRENCY_RATES[to] || 1.0;
  return Number((amount * (toRate / fromRate)).toFixed(2));
};

export const createBalanceTopUpIntent = async (
  _userId: string,
  data: BalanceTopUpRequest
): Promise<PaymentIntent> => {
  const { amount, currency, paymentMethod, promoCode } = data;

  // Validate amount
  if (amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  // Apply promo code if provided
  let discount = 0;
  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCode },
    });

    if (promo?.active && promo.usedCount < (promo.maxUses ?? Infinity)) {
      const now = new Date();
      if (now >= promo.validFrom && now <= promo.validUntil) {
        discount = Number((amount * Number(promo.discount) / 100).toFixed(2));
      }
    }
  }

  const finalAmount = amount - discount;

  // Convert currency if needed (EUR to gateway currency, e.g., PLN)
  const gatewayCurrency = 'PLN'; // Example: gateway uses PLN
  const gatewayAmount = convertCurrency(finalAmount, currency, gatewayCurrency);

  // Create payment intent (in real implementation, this would call the payment gateway)
  const intentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Store payment intent in database (or cache)
  // For now, we'll return the intent directly

  // Generate redirect URL (in real implementation, this would be from the gateway)
  const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/redirect?intent=${intentId}`;

  return {
    id: intentId,
    amount: gatewayAmount,
    currency: gatewayCurrency,
    paymentMethod,
    redirectUrl,
    status: 'pending',
  };
};

export const processPaymentWebhook = async (data: PaymentWebhook): Promise<void> => {
  const { transactionId, email, amount, currency, method, status } = data;

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create user if doesn't exist (shouldn't happen in normal flow, but handle it)
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: '', // User will need to set password later
        nickname: 'Newbie Guy',
        firstName: data.name,
        lastName: data.surname,
      },
    });
  }

  // Only process if status is completed
  if (status !== 'completed') {
    return;
  }

  // Convert currency back to EUR
  const eurAmount = convertCurrency(amount, currency, 'EUR');

  // Update user balance
  await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: {
        increment: eurAmount,
      },
    },
  });

  // Create transaction
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'TOP_UP',
      amount: eurAmount,
      currency: 'EUR',
      method,
      status: 'COMPLETED',
      description: `Balance top-up via ${method}`,
      transactionHash: transactionId,
      gatewayResponse: data as unknown as Record<string, unknown>,
    },
  });

  // Send email
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (updatedUser) {
    await sendBalanceTopUpEmail(email, {
      amount: eurAmount,
      currency: 'EUR',
      balance: Number(updatedUser.balance),
    });
  }
};

export const processTerminalWebhook = async (data: TerminalWebhook): Promise<void> => {
  const { transactionId, email, name, surname, amount, currency, status } = data;

  // Only process completed transactions
  if (status !== 'completed') {
    return;
  }

  // Find or create user (without password - cannot login)
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: '', // No password - user cannot login
        nickname: 'Newbie Guy',
        firstName: name,
        lastName: surname,
      },
    });
  }

  // Convert currency to EUR
  const eurAmount = convertCurrency(amount, currency, 'EUR');

  // Top up balance
  await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: {
        increment: eurAmount,
      },
    },
  });

  // Create transaction
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'TOP_UP',
      amount: eurAmount,
      currency: 'EUR',
      method: data.method,
      status: 'COMPLETED',
      description: `Terminal top-up`,
      transactionHash: transactionId,
      gatewayResponse: data as unknown as Record<string, unknown>,
    },
  });

  // Generate fake purchases (85-100% of balance)
  const balance = Number(user.balance);
  const purchaseAmount = balance * (0.85 + Math.random() * 0.15); // 85-100%

  // Get random games
  const games = await prisma.game.findMany({
    where: { inStock: true },
    take: Math.floor(Math.random() * 5) + 1, // 1-5 games
  });

  if (games.length > 0) {
    let remainingAmount = purchaseAmount;
    const orderItems = [];

    for (const game of games) {
      if (remainingAmount <= 0) break;
      const gamePrice = Number(game.price);
      if (gamePrice <= remainingAmount) {
        orderItems.push({
          gameId: game.id,
          quantity: 1,
          price: gamePrice,
          discount: 0,
        });
        remainingAmount -= gamePrice;
      }
    }

    if (orderItems.length > 0) {
      const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
      const total = subtotal;

      // Create order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status: 'COMPLETED',
          subtotal,
          discount: 0,
          total,
          paymentStatus: 'COMPLETED',
          completedAt: new Date(),
          items: {
            create: orderItems,
          },
        },
      });

      // Deduct balance
      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: {
            decrement: total,
          },
        },
      });

      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: user.id,
          orderId: order.id,
          type: 'PURCHASE',
          amount: -total,
          currency: 'EUR',
          status: 'COMPLETED',
          description: `Fake purchase order ${order.id}`,
        },
      });

      // Generate fake keys
      for (const item of orderItems) {
        const game = games.find((gameItem) => gameItem.id === item.gameId);
        if (game) {
          const fakeKey = `FAKE-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          await prisma.gameKey.create({
            data: {
              gameId: item.gameId,
              key: fakeKey,
              orderId: order.id,
            },
          });
        }
      }
    }
  }

  // NO EMAIL SENT for terminal transactions
};

/**
 * Refund result interface
 */
export interface RefundResult {
  refundId: string;
  status: string;
  amount?: number;
  currency?: string;
  message?: string;
}

/**
 * Refund a transaction through the appropriate payment gateway
 */
export const refundTransaction = async (
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> => {
  // Find the transaction
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: true,
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  // Check if transaction is refundable
  if (transaction.type !== 'TOP_UP' && transaction.type !== 'PURCHASE') {
    throw new AppError('Transaction type is not refundable', 400);
  }

  if (transaction.status !== 'COMPLETED') {
    throw new AppError('Only completed transactions can be refunded', 400);
  }

  // Check if already refunded
  const existingRefund = await prisma.transaction.findFirst({
    where: {
      orderId: transaction.orderId,
      type: 'REFUND',
      status: 'COMPLETED',
    },
  });

  if (existingRefund) {
    throw new AppError('Transaction has already been refunded', 400);
  }

  const refundAmount = amount ? Number(amount) : Math.abs(Number(transaction.amount));
  const paymentMethod = transaction.method?.toLowerCase() || '';

  let refundResult: RefundResult;

  // Route to appropriate gateway
  if (paymentMethod.includes('stripe')) {
    const paymentIntentId = transaction.transactionHash || '';
    refundResult = await refundStripeTransaction(paymentIntentId, refundAmount);
  } else if (paymentMethod.includes('paypal')) {
    const captureId = transaction.transactionHash || '';
    refundResult = await refundPayPalTransaction(captureId, refundAmount, transaction.currency);
  } else if (paymentMethod.includes('mollie')) {
    const paymentId = transaction.transactionHash || '';
    refundResult = await refundMollieTransaction(paymentId, refundAmount, reason);
  } else if (paymentMethod.includes('terminal')) {
    refundResult = await refundTerminalTransaction(transactionId, refundAmount, reason);
  } else {
    throw new AppError(`Refund not supported for payment method: ${paymentMethod}`, 400);
  }

  // Update user balance and create refund transaction atomically
  await prisma.$transaction(async (tx) => {
    // Update user balance (add refund amount)
    await tx.user.update({
      where: { id: transaction.userId },
      data: {
        balance: {
          increment: refundAmount,
        },
      },
    });

    // Create refund transaction record
    await tx.transaction.create({
      data: {
        userId: transaction.userId,
        orderId: transaction.orderId,
        type: 'REFUND',
        amount: refundAmount,
        currency: transaction.currency,
        method: transaction.method,
        status: refundResult.status === 'succeeded' || refundResult.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        description: reason || `Refund for transaction ${transactionId}`,
        transactionHash: refundResult.refundId,
        gatewayResponse: refundResult as unknown as Record<string, unknown>,
      },
    });
  });

  return {
    ...refundResult,
    amount: refundAmount,
    currency: transaction.currency,
  };
};

/**
 * Refund Stripe transaction
 */
const refundStripeTransaction = async (
  paymentIntentId: string,
  amount?: number
): Promise<RefundResult> => {
  try {
    const result = await createStripeRefund(paymentIntentId, amount);
    return {
      refundId: result.refundId,
      status: result.status,
    };
  } catch (error) {
    throw new AppError(
      `Stripe refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
};

/**
 * Refund PayPal transaction
 */
const refundPayPalTransaction = async (
  captureId: string,
  amount?: number,
  currency: string = 'EUR'
): Promise<RefundResult> => {
  try {
    const result = await createPayPalRefund(captureId, amount, currency);
    return {
      refundId: result.refundId,
      status: result.status,
    };
  } catch (error) {
    throw new AppError(
      `PayPal refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
};

/**
 * Refund Mollie transaction
 */
const refundMollieTransaction = async (
  paymentId: string,
  amount?: number,
  description?: string
): Promise<RefundResult> => {
  try {
    const result = await createMollieRefund(paymentId, amount, description);
    return {
      refundId: result.refundId,
      status: result.status,
    };
  } catch (error) {
    throw new AppError(
      `Mollie refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
};

/**
 * Refund Terminal transaction
 * Note: Terminal payments may be non-refundable; verify with business requirements
 */
const refundTerminalTransaction = async (
  transactionId: string,
  amount: number,
  reason?: string
): Promise<RefundResult> => {
  // Terminal payments are typically bank transfers and may not support refunds
  // This is a placeholder implementation - verify business requirements
  // For now, we'll create a manual refund record without calling an external API
  
  const refundId = `TERM-REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  console.log('[Terminal] Created manual refund:', {
    refundId,
    transactionId,
    amount,
    reason,
  });

  return {
    refundId,
    status: 'COMPLETED',
    message: 'Terminal refund processed manually (no gateway API available)',
  };
};

