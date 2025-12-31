export interface BalanceTopUpRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  promoCode?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  redirectUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface PaymentWebhook {
  transactionId: string;
  email: string;
  name?: string;
  surname?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  timestamp: string;
  hash?: string;
}

export interface TerminalWebhook {
  transactionId: string;
  email: string;
  name?: string;
  surname?: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  timestamp: string;
  hash?: string;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  orderId?: string;
  type: 'TOP_UP' | 'PURCHASE' | 'REFUND';
  amount: number;
  currency: string;
  method?: string;
  status: string;
  description?: string;
  transactionHash?: string;
  createdAt: string;
}
