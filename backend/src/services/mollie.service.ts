import { AppError } from '../middleware/errorHandler.js';

// Mollie types
interface MolliePayment {
  id: string;
  status: 'open' | 'pending' | 'authorized' | 'paid' | 'expired' | 'failed' | 'canceled';
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
  _links: {
    checkout?: { href: string };
    self: { href: string };
  };
}

interface MollieWebhookPayload {
  id: string;
}

/**
 * Get Mollie API client
 */
const getMollieHeaders = (): Record<string, string> => {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Mollie API key not configured');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Create a Mollie Payment for balance top-up
 */
export const createMolliePayment = async (
  userId: string,
  amount: number,
  currency: string = 'EUR',
  description: string,
  redirectUrl: string,
  webhookUrl: string
): Promise<{ paymentId: string; checkoutUrl: string }> => {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    throw new AppError('Mollie not configured', 500);
  }

  const baseUrl = 'https://api.mollie.com/v2';

  // In production:
  // const response = await fetch(`${baseUrl}/payments`, {
  //   method: 'POST',
  //   headers: getMollieHeaders(),
  //   body: JSON.stringify({
  //     amount: {
  //       currency: currency,
  //       value: amount.toFixed(2),
  //     },
  //     description,
  //     redirectUrl,
  //     webhookUrl,
  //     metadata: {
  //       userId,
  //       type: 'balance_topup',
  //       amount: amount.toString(),
  //     },
  //   }),
  // });
  // const payment: MolliePayment = await response.json();

  // Mock implementation
  const paymentId = `tr_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 6)}`;
  const checkoutUrl = `https://www.mollie.com/checkout/select-issuer/ideal/${paymentId}`;

  console.log('[Mollie] Created payment:', {
    paymentId,
    userId,
    amount,
    currency,
  });

  return {
    paymentId,
    checkoutUrl,
  };
};

/**
 * Get Mollie payment by ID
 */
export const getMolliePayment = async (
  paymentId: string
): Promise<MolliePayment | null> => {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  const baseUrl = 'https://api.mollie.com/v2';

  // In production:
  // const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
  //   headers: getMollieHeaders(),
  // });
  // return response.json();

  console.log('[Mollie] Getting payment:', paymentId);
  return null;
};

/**
 * Process Mollie webhook
 */
export const processMollieWebhook = async (
  paymentId: string
): Promise<{ success: boolean; userId?: string; amount?: number; status: string }> => {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    return { success: false, status: 'error' };
  }

  // Get payment details
  const baseUrl = 'https://api.mollie.com/v2';

  // In production:
  // const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
  //   headers: getMollieHeaders(),
  // });
  // const payment: MolliePayment = await response.json();

  // Mock payment status check
  console.log('[Mollie] Processing webhook for payment:', paymentId);

  // Mock successful payment
  const mockPayment: MolliePayment = {
    id: paymentId,
    status: 'paid',
    amount: {
      value: '10.00',
      currency: 'EUR',
    },
    description: 'Balance Top-Up',
    redirectUrl: '',
    webhookUrl: '',
    metadata: {
      userId: 'mock-user-id',
      type: 'balance_topup',
      amount: '10',
    },
    _links: {
      self: { href: `${baseUrl}/payments/${paymentId}` },
    },
  };

  if (mockPayment.status === 'paid') {
    return {
      success: true,
      userId: mockPayment.metadata.userId,
      amount: parseFloat(mockPayment.metadata.amount),
      status: 'paid',
    };
  }

  return {
    success: false,
    status: mockPayment.status,
  };
};

/**
 * Create Mollie refund
 */
export const createMollieRefund = async (
  paymentId: string,
  amount?: number,
  description?: string
): Promise<{ refundId: string; status: string }> => {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    throw new AppError('Mollie not configured', 500);
  }

  const baseUrl = 'https://api.mollie.com/v2';

  // In production:
  // const body: Record<string, unknown> = {};
  // if (amount) {
  //   const payment = await getMolliePayment(paymentId);
  //   body.amount = {
  //     currency: payment?.amount.currency || 'EUR',
  //     value: amount.toFixed(2),
  //   };
  // }
  // if (description) {
  //   body.description = description;
  // }
  //
  // const response = await fetch(`${baseUrl}/payments/${paymentId}/refunds`, {
  //   method: 'POST',
  //   headers: getMollieHeaders(),
  //   body: JSON.stringify(body),
  // });

  const refundId = `re_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 6)}`;

  console.log('[Mollie] Created refund:', {
    refundId,
    paymentId,
    amount,
  });

  return {
    refundId,
    status: 'pending',
  };
};

/**
 * Get available Mollie payment methods
 */
export const getMolliePaymentMethods = async (): Promise<string[]> => {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    return [];
  }

  // In production:
  // const response = await fetch('https://api.mollie.com/v2/methods', {
  //   headers: getMollieHeaders(),
  // });
  // const data = await response.json();
  // return data._embedded.methods.map((m: { id: string }) => m.id);

  // Return common Mollie methods
  return [
    'ideal',
    'creditcard',
    'bancontact',
    'sofort',
    'eps',
    'giropay',
    'przelewy24',
    'kbc',
    'belfius',
  ];
};

/**
 * Create payment with specific method
 */
export const createMolliePaymentWithMethod = async (
  userId: string,
  amount: number,
  currency: string,
  method: string,
  description: string,
  redirectUrl: string,
  webhookUrl: string,
  issuer?: string
): Promise<{ paymentId: string; checkoutUrl: string }> => {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    throw new AppError('Mollie not configured', 500);
  }

  const baseUrl = 'https://api.mollie.com/v2';

  // In production:
  // const body: Record<string, unknown> = {
  //   amount: {
  //     currency,
  //     value: amount.toFixed(2),
  //   },
  //   description,
  //   redirectUrl,
  //   webhookUrl,
  //   method,
  //   metadata: {
  //     userId,
  //     type: 'balance_topup',
  //     amount: amount.toString(),
  //   },
  // };
  // if (issuer) {
  //   body.issuer = issuer;
  // }
  //
  // const response = await fetch(`${baseUrl}/payments`, {
  //   method: 'POST',
  //   headers: getMollieHeaders(),
  //   body: JSON.stringify(body),
  // });

  const paymentId = `tr_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 6)}`;
  const checkoutUrl = method === 'ideal' && issuer
    ? `https://www.mollie.com/checkout/issuer/${method}/${paymentId}`
    : `https://www.mollie.com/checkout/${method}/${paymentId}`;

  console.log('[Mollie] Created payment with method:', {
    paymentId,
    userId,
    amount,
    currency,
    method,
  });

  return {
    paymentId,
    checkoutUrl,
  };
};

