import { AppError } from '../middleware/errorHandler.js';

// PayPal types
interface PayPalOrder {
  id: string;
  status: string;
  links: { href: string; rel: string }[];
  purchase_units: {
    amount: {
      currency_code: string;
      value: string;
    };
    custom_id?: string;
  }[];
}

interface PayPalCaptureResult {
  id: string;
  status: string;
  purchase_units: {
    payments: {
      captures: {
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }[];
    };
  }[];
}

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    custom_id?: string;
    purchase_units?: {
      custom_id?: string;
      amount: {
        currency_code: string;
        value: string;
      };
    }[];
  };
}

/**
 * Get PayPal access token
 */
const getPayPalAccessToken = async (): Promise<string> => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  // In production:
  // const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
  //   },
  //   body: 'grant_type=client_credentials',
  // });
  // const data = await response.json();
  // return data.access_token;

  // Mock implementation
  return `mock_access_token_${Date.now()}`;
};

/**
 * Create a PayPal Order for balance top-up
 */
export const createPayPalOrder = async (
  userId: string,
  amount: number,
  currency: string = 'EUR',
  returnUrl: string,
  cancelUrl: string
): Promise<{ orderId: string; approvalUrl: string }> => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  
  if (!clientId) {
    throw new AppError('PayPal not configured', 500);
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  // In production:
  // const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${accessToken}`,
  //   },
  //   body: JSON.stringify({
  //     intent: 'CAPTURE',
  //     purchase_units: [{
  //       amount: {
  //         currency_code: currency,
  //         value: amount.toFixed(2),
  //       },
  //       custom_id: `${userId}:balance_topup:${amount}`,
  //       description: `Balance Top-Up - ${amount} ${currency}`,
  //     }],
  //     application_context: {
  //       return_url: returnUrl,
  //       cancel_url: cancelUrl,
  //       brand_name: 'Gkeys Store',
  //       landing_page: 'LOGIN',
  //       user_action: 'PAY_NOW',
  //     },
  //   }),
  // });
  // const order: PayPalOrder = await response.json();

  // Mock implementation
  const orderId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`;

  console.log('[PayPal] Created order:', {
    orderId,
    userId,
    amount,
    currency,
  });

  return {
    orderId,
    approvalUrl,
  };
};

/**
 * Capture a PayPal Order (after user approval)
 */
export const capturePayPalOrder = async (
  orderId: string
): Promise<{ captureId: string; status: string; amount: number; userId?: string }> => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  
  if (!clientId) {
    throw new AppError('PayPal not configured', 500);
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  // In production:
  // const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${accessToken}`,
  //   },
  // });
  // const result: PayPalCaptureResult = await response.json();

  // Mock implementation
  const captureId = `CAP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  console.log('[PayPal] Captured order:', {
    orderId,
    captureId,
  });

  return {
    captureId,
    status: 'COMPLETED',
    amount: 0, // Would come from the actual response
    userId: undefined, // Would be extracted from custom_id
  };
};

/**
 * Verify PayPal webhook signature
 */
export const verifyPayPalWebhook = async (
  headers: Record<string, string>,
  body: string
): Promise<boolean> => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  
  if (!webhookId) {
    console.error('[PayPal] Webhook ID not configured');
    return false;
  }

  // In production, verify webhook signature using PayPal API:
  // const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${accessToken}`,
  //   },
  //   body: JSON.stringify({
  //     auth_algo: headers['paypal-auth-algo'],
  //     cert_url: headers['paypal-cert-url'],
  //     transmission_id: headers['paypal-transmission-id'],
  //     transmission_sig: headers['paypal-transmission-sig'],
  //     transmission_time: headers['paypal-transmission-time'],
  //     webhook_id: webhookId,
  //     webhook_event: JSON.parse(body),
  //   }),
  // });

  // Mock verification
  console.log('[PayPal] Verifying webhook...');
  return true;
};

/**
 * Process PayPal webhook event
 */
export const processPayPalWebhook = async (
  event: PayPalWebhookEvent
): Promise<{ success: boolean; userId?: string; amount?: number }> => {
  const { event_type, resource } = event;

  console.log('[PayPal] Processing webhook:', event_type);

  switch (event_type) {
    case 'CHECKOUT.ORDER.APPROVED': {
      // Order approved, capture the payment
      const captureResult = await capturePayPalOrder(resource.id);
      if (captureResult.status === 'COMPLETED') {
        // Extract userId and amount from custom_id
        const customId = resource.purchase_units?.[0]?.custom_id || '';
        const [userId, , amountStr] = customId.split(':');
        return {
          success: true,
          userId,
          amount: parseFloat(amountStr) || captureResult.amount,
        };
      }
      break;
    }
    case 'PAYMENT.CAPTURE.COMPLETED': {
      // Payment captured successfully
      const customId = resource.custom_id || '';
      const [userId, , amountStr] = customId.split(':');
      const amount = resource.amount?.value ? parseFloat(resource.amount.value) : parseFloat(amountStr);
      return {
        success: true,
        userId,
        amount,
      };
    }
    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.REFUNDED': {
      console.error('[PayPal] Payment failed or refunded:', event.id);
      return { success: false };
    }
  }

  return { success: false };
};

/**
 * Get PayPal order details
 */
export const getPayPalOrder = async (
  orderId: string
): Promise<PayPalOrder | null> => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  
  if (!clientId) {
    return null;
  }

  // In production:
  // const accessToken = await getPayPalAccessToken();
  // const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
  //   headers: { 'Authorization': `Bearer ${accessToken}` },
  // });
  // return response.json();

  console.log('[PayPal] Getting order:', orderId);
  return null;
};

/**
 * Issue refund for a PayPal payment
 */
export const createPayPalRefund = async (
  captureId: string,
  amount?: number,
  currency: string = 'EUR'
): Promise<{ refundId: string; status: string }> => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  
  if (!clientId) {
    throw new AppError('PayPal not configured', 500);
  }

  const _accessToken = await getPayPalAccessToken();
  const _baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  // In production:
  // const response = await fetch(`${_baseUrl}/v2/payments/captures/${captureId}/refund`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${accessToken}`,
  //   },
  //   body: JSON.stringify(amount ? {
  //     amount: {
  //       value: amount.toFixed(2),
  //       currency_code: currency,
  //     },
  //   } : {}),
  // });

  const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  console.log('[PayPal] Created refund:', {
    refundId,
    captureId,
    amount,
  });

  return {
    refundId,
    status: 'COMPLETED',
  };
};

