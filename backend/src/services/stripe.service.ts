import { AppError } from '../middleware/errorHandler.js';

// Stripe types
interface StripeCheckoutSession {
  id: string;
  url: string;
  amount_total: number;
  currency: string;
  customer_email: string | null;
  payment_status: string;
  status: string;
  metadata: Record<string, string>;
}

interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  metadata: Record<string, string>;
}

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession | StripePaymentIntent;
  };
}

// In production, use: import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Create a Stripe Checkout Session for balance top-up
 */
export const createStripeCheckoutSession = async (
  userId: string,
  amount: number,
  currency: string = 'EUR',
  _successUrl: string,
  _cancelUrl: string
): Promise<{ sessionId: string; url: string }> => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new AppError('Stripe not configured', 500);
  }

  // Convert amount to cents (Stripe uses smallest currency unit)
  const _amountInCents = Math.round(amount * 100);

  // In production:
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card'],
  //   line_items: [{
  //     price_data: {
  //       currency: currency.toLowerCase(),
  //       product_data: {
  //         name: 'Balance Top-Up',
  //         description: `Add ${amount} ${currency} to your account balance`,
  //       },
  //       unit_amount: amountInCents,
  //     },
  //     quantity: 1,
  //   }],
  //   mode: 'payment',
  //   success_url: successUrl,
  //   cancel_url: cancelUrl,
  //   metadata: {
  //     userId,
  //     type: 'balance_topup',
  //     amount: amount.toString(),
  //     currency,
  //   },
  // });

  // Mock implementation for development
  const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const mockUrl = `https://checkout.stripe.com/pay/${sessionId}`;

  console.log('[Stripe] Created checkout session:', {
    sessionId,
    userId,
    amount,
    currency,
  });

  return {
    sessionId,
    url: mockUrl,
  };
};

/**
 * Create a Stripe Payment Intent for direct payment
 */
export const createStripePaymentIntent = async (
  userId: string,
  amount: number,
  currency: string = 'EUR'
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new AppError('Stripe not configured', 500);
  }

  const _amountInCents = Math.round(amount * 100);

  // In production:
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: amountInCents,
  //   currency: currency.toLowerCase(),
  //   metadata: {
  //     userId,
  //     type: 'balance_topup',
  //   },
  // });

  // Mock implementation
  const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`;

  console.log('[Stripe] Created payment intent:', {
    paymentIntentId,
    userId,
    amount,
    currency,
  });

  return {
    clientSecret,
    paymentIntentId,
  };
};

/**
 * Verify Stripe webhook signature
 */
export const verifyStripeWebhook = (
  payload: string,
  _signature: string
): StripeWebhookEvent | null => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe] Webhook secret not configured');
    return null;
  }

  // In production:
  // try {
  //   const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  //   return event;
  // } catch (err) {
  //   console.error('[Stripe] Webhook signature verification failed:', err);
  //   return null;
  // }

  // Mock verification - parse the payload
  try {
    const event = JSON.parse(payload) as StripeWebhookEvent;
    console.log('[Stripe] Webhook received:', event.type);
    return event;
  } catch {
    return null;
  }
};

/**
 * Process Stripe webhook event
 */
export const processStripeWebhook = async (
  event: StripeWebhookEvent
): Promise<{ success: boolean; userId?: string; amount?: number }> => {
  const { type, data } = event;

  switch (type) {
    case 'checkout.session.completed': {
      const session = data.object as StripeCheckoutSession;
      if (session.payment_status === 'paid' && session.metadata.type === 'balance_topup') {
        return {
          success: true,
          userId: session.metadata.userId,
          amount: parseFloat(session.metadata.amount),
        };
      }
      break;
    }
    case 'payment_intent.succeeded': {
      const intent = data.object as StripePaymentIntent;
      if (intent.metadata.type === 'balance_topup') {
        return {
          success: true,
          userId: intent.metadata.userId,
          amount: intent.amount / 100,
        };
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      console.error('[Stripe] Payment failed:', event.id);
      return { success: false };
    }
  }

  return { success: false };
};

/**
 * Retrieve Stripe session details
 */
export const getStripeSession = async (
  sessionId: string
): Promise<StripeCheckoutSession | null> => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  // In production:
  // const session = await stripe.checkout.sessions.retrieve(sessionId);
  // return session;

  // Mock implementation
  console.log('[Stripe] Retrieving session:', sessionId);
  return null;
};

/**
 * Issue refund for a payment
 */
export const createStripeRefund = async (
  paymentIntentId: string,
  amount?: number
): Promise<{ refundId: string; status: string }> => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new AppError('Stripe not configured', 500);
  }

  // In production:
  // const refund = await stripe.refunds.create({
  //   payment_intent: paymentIntentId,
  //   amount: amount ? Math.round(amount * 100) : undefined,
  // });

  const refundId = `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('[Stripe] Created refund:', {
    refundId,
    paymentIntentId,
    amount,
  });

  return {
    refundId,
    status: 'succeeded',
  };
};
