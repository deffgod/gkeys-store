export interface CreateOrderRequest {
  items: {
    gameId: string;
    quantity: number;
  }[];
  promoCode?: string;
}

export interface OrderResponse {
  id: string;
  userId: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  promoCode?: string;
  createdAt: string;
  completedAt?: string;
  items: OrderItemResponse[];
  keys?: GameKeyResponse[];
}

export interface OrderItemResponse {
  id: string;
  gameId: string;
  game: {
    id: string;
    title: string;
    image: string;
    slug: string;
  };
  quantity: number;
  price: number;
  discount: number;
}

export interface GameKeyResponse {
  id: string;
  gameId: string;
  key: string;
  activated: boolean;
  activationDate?: string;
}
