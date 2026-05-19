// Client-facing cart types. The query layer maps the backend's snake_case
// CartView/CheckoutResult into these camelCase shapes.

export interface AppliedSlab {
  minQty: number;
  discountPercent: number;
  nudgeMessage: string | null;
}

export interface ServerCartItem {
  variantId: number;
  skuId: number | null;
  displayName: string;
  productName: string;
  image: string | null;
  qty: number;
  unitPrice: number;
  effectiveUnitPrice: number;
  effectiveUnitPriceWithGst: number | null;
  gstRate: number | null;
  gstAmountPerUnit: number | null;
  gstTotal: number | null;
  lineDiscount: number;
  lineTotal: number;
  inStock: boolean;
  isAvailable: boolean;
  appliedSlab: AppliedSlab | null;
}

export interface CartDeliveryAddress {
  id: number;
  label: string | null;
  addressLine: string;
  pincode: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
}

export interface ServerCart {
  id: number | null;
  items: ServerCartItem[];
  warehouseId: number | null;
  deliveryAddress: CartDeliveryAddress | null;
  couponCode: string | null;
  subtotal: number;
  couponDiscount: number;
  total: number;
  canOrder: boolean;
}

export interface AddCartItemRequest {
  variantId: number;
  qty: number;
}

export interface UpdateCartItemRequest {
  qty: number;
}

export interface SetCartAddressRequest {
  deliveryAddressId: number;
}

export interface SetCartCouponRequest {
  couponCode: string;
}

export interface CheckoutCartRequest {
  paymentMethodId: number;
}

export type CartItemDropReason = 'no_price' | 'no_stock';

export interface CartAddressDroppedItem {
  variantId: number;
  displayName: string;
  reason: CartItemDropReason;
}

export interface CartAddressPriceChange {
  variantId: number;
  displayName: string;
  oldUnitPrice: number | null;
  newUnitPrice: number | null;
}

export interface CartAddressSwitchDiff {
  previousWarehouseId: number | null;
  newWarehouseId: number | null;
  previousSubtotal: number;
  newSubtotal: number;
  droppedItems: CartAddressDroppedItem[];
  removedCoupon: string | null;
  priceChanges: CartAddressPriceChange[];
}

export interface CartAddressSwitchResult {
  cart: ServerCart;
  diff: CartAddressSwitchDiff;
}

export interface CheckoutCartResponse {
  /** Null for online gateway until payment succeeds (order created on verify). */
  orderId: number | null;
  orderNumber: string | null;
  status: 'processing' | 'pending_payment' | string;
  paymentStatus: 'pending';
  paymentMethod: {
    id: number;
    name: string;
    type: 'manual' | 'gateway' | 'cod' | string;
  };
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  totalAmount: number;
  nextStep: 'awaiting_payment' | 'processing';
  /** Present when checkout opened Razorpay without creating an order yet. */
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  /** Amount in paise for Razorpay. */
  amount?: number;
  currency?: string;
  /** Payments row id for deferred gateway checkout (optional). */
  paymentId?: string;
}
