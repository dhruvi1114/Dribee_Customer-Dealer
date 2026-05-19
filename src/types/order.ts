export type OrderStatus =
  | 'pending_payment'
  | 'payment_verified'
  | 'processing'
  | 'pick_list_generated'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  productId: number;
  variantId: number;
  name: string;
  variant: string;
  image?: string | null;
  sku: string;
  qty: number;
  price: number;
  dealerPrice?: number;
  total: number;
}

export interface OrderTimeline {
  step: string;
  timestamp: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  /** ISO timestamp when the order was marked delivered (for return window). */
  deliveredAt?: string | null;
  /** Same as tenant `order_settings.return_window_days` when the orders API includes it. */
  returnWindowDays?: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  address: string;
  timeline: OrderTimeline[];
  notes?: string;
  cancellationReason?: string | null;
  refundStatus?: 'not_applicable' | 'pending' | 'processed';
  refundProcessedAt?: string | null;
}

export interface CreateOrderItem {
  variantId: number;
  qty: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
  warehouseId: number;
  paymentMethodId?: string;
  couponCode?: string;
  notes?: string;
  address: string;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  /** Maps to `returns_only` — orders whose return was accepted (not pending-only). */
  returnsOnly?: boolean;
}


export interface CartItem {
  variantId: number;
  qty: number;
  productName: string;
  variantName: string;
  price: number;
  dealerPrice?: number;
  image?: string;
  warehouseId?: number | null;
  volumeSlabs?: Array<{ id: number; minQty: number; maxQty?: number; price: number; discount?: number }>;
  unavailable?: boolean;
}

export interface CartState {
  items: CartItem[];
  couponCode?: string;
  discount: number;
  warehouseId?: number | null;
}
