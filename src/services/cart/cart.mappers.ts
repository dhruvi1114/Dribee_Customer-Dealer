import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import type {
  CartAddressSwitchDiff,
  CartAddressSwitchResult,
  CartDeliveryAddress,
  CartItemDropReason,
  CheckoutCartResponse,
  ServerCart,
  ServerCartItem,
} from '@/types/cart';

interface RawCartItem {
  variant_id: number;
  sku_id: number | null;
  display_name: string;
  product_name: string;
  image: string | null;
  qty: number;
  unit_price: {
    amount: number;
    source: 'warehouse' | 'base';
    gst_rate?: number | null;
    gst_amount?: number | null;
    price_with_gst?: number | null;
  } | null;
  applied_slab: {
    min_qty: number;
    discount_percent: number;
    nudge_message: string | null;
  } | null;
  effective_unit_price: number | null;
  effective_unit_price_with_gst?: number | null;
  line_discount: number;
  in_stock: boolean;
  is_available: boolean;
  line_total: number | null;
  gst_total?: number | null;
}

interface RawDeliveryAddress {
  id: number;
  label: string | null;
  address_line: string;
  pincode: string | null;
  warehouse_id: number | null;
  warehouse_name: string | null;
}

export interface RawCartView {
  cart_id: number;
  delivery_address: RawDeliveryAddress | null;
  warehouse_id: number | null;
  items: RawCartItem[];
  subtotal: number;
  coupon_code: string | null;
  coupon_discount: number;
  total: number;
  can_order: boolean;
}

interface RawCheckoutResult {
  order_id: number | null;
  order_number: string | null;
  status: 'processing' | 'pending_payment' | string;
  payment_status: 'pending';
  payment_method: { id: number; name: string; type: 'manual' | 'gateway' | string };
  subtotal: number;
  discount_amount: number;
  gst_amount: number;
  total_amount: number;
  next_step: 'awaiting_payment' | 'processing';
  razorpay_order_id?: string;
  razorpay_key_id?: string;
  amount?: number;
  currency?: string;
  payment_id?: string;
}

const mapAddress = (raw: RawDeliveryAddress | null): CartDeliveryAddress | null =>
  raw == null
    ? null
    : {
        id: raw.id,
        label: raw.label,
        addressLine: raw.address_line,
        pincode: raw.pincode,
        warehouseId: raw.warehouse_id,
        warehouseName: raw.warehouse_name,
      };

const mapItem = (raw: RawCartItem): ServerCartItem => {
  const baseUnit = raw.unit_price?.amount ?? 0;
  const effective = raw.effective_unit_price ?? baseUnit;
  const effectiveWithGst = raw.effective_unit_price_with_gst ?? null;
  return {
    variantId: raw.variant_id,
    skuId: raw.sku_id,
    displayName: raw.display_name,
    productName: raw.product_name,
    image: resolveMediaUrl(raw.image ?? null),
    qty: raw.qty,
    unitPrice: baseUnit,
    effectiveUnitPrice: effective,
    effectiveUnitPriceWithGst: effectiveWithGst,
    gstRate: raw.unit_price?.gst_rate ?? null,
    gstAmountPerUnit: raw.unit_price?.gst_amount ?? null,
    gstTotal: raw.gst_total ?? null,
    lineDiscount: raw.line_discount,
    lineTotal: raw.line_total ?? (effectiveWithGst ?? effective) * raw.qty,
    inStock: raw.in_stock,
    isAvailable: raw.is_available,
    appliedSlab: raw.applied_slab
      ? {
          minQty: raw.applied_slab.min_qty,
          discountPercent: raw.applied_slab.discount_percent,
          nudgeMessage: raw.applied_slab.nudge_message,
        }
      : null,
  };
};

export const mapCartView = (raw: RawCartView): ServerCart => ({
  id: raw.cart_id,
  items: raw.items.map(mapItem),
  warehouseId: raw.warehouse_id,
  deliveryAddress: mapAddress(raw.delivery_address),
  couponCode: raw.coupon_code,
  subtotal: raw.subtotal,
  couponDiscount: raw.coupon_discount ?? 0,
  total: raw.total ?? raw.subtotal,
  canOrder: raw.can_order,
});


export const EMPTY_CART: ServerCart = {
  id: null,
  items: [],
  warehouseId: null,
  deliveryAddress: null,
  couponCode: null,
  subtotal: 0,
  couponDiscount: 0,
  total: 0,
  canOrder: false,
};

interface RawCartAddressSwitchDiff {
  previous_warehouse_id: number | null;
  new_warehouse_id: number | null;
  previous_subtotal: number;
  new_subtotal: number;
  dropped_items: Array<{
    variant_id: number;
    display_name: string;
    reason: CartItemDropReason;
  }>;
  removed_coupon: string | null;
  price_changes: Array<{
    variant_id: number;
    display_name: string;
    old_unit_price: number | null;
    new_unit_price: number | null;
  }>;
}

export interface RawCartAddressSwitchResult {
  cart: RawCartView;
  diff: RawCartAddressSwitchDiff;
}

const mapAddressSwitchDiff = (raw: RawCartAddressSwitchDiff): CartAddressSwitchDiff => ({
  previousWarehouseId: raw.previous_warehouse_id,
  newWarehouseId: raw.new_warehouse_id,
  previousSubtotal: raw.previous_subtotal,
  newSubtotal: raw.new_subtotal,
  droppedItems: raw.dropped_items.map((d) => ({
    variantId: d.variant_id,
    displayName: d.display_name,
    reason: d.reason,
  })),
  removedCoupon: raw.removed_coupon,
  priceChanges: raw.price_changes.map((p) => ({
    variantId: p.variant_id,
    displayName: p.display_name,
    oldUnitPrice: p.old_unit_price,
    newUnitPrice: p.new_unit_price,
  })),
});

export const mapCartAddressSwitchResult = (
  raw: RawCartAddressSwitchResult,
): CartAddressSwitchResult => ({
  cart: mapCartView(raw.cart),
  diff: mapAddressSwitchDiff(raw.diff),
});

export const mapCheckoutResult = (raw: RawCheckoutResult): CheckoutCartResponse => ({
  orderId: raw.order_id,
  orderNumber: raw.order_number,
  status: raw.status,
  paymentStatus: raw.payment_status,
  paymentMethod: raw.payment_method,
  subtotal: raw.subtotal,
  discountAmount: raw.discount_amount,
  gstAmount: raw.gst_amount,
  totalAmount: raw.total_amount,
  nextStep: raw.next_step,
  razorpayOrderId: raw.razorpay_order_id,
  razorpayKeyId: raw.razorpay_key_id,
  amount: raw.amount,
  currency: raw.currency,
  paymentId: raw.payment_id,
});
