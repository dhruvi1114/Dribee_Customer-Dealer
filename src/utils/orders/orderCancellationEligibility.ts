import type { Order } from '@/types/order';

/**
 * Order rows the backend allows through `cancelOrderById` (customer/dealer self-cancel).
 * @see `cancelOrderById` in `order.repository.ts` — any other status yields `ORDER_NOT_CANCELLABLE`.
 */
export const BUYER_CANCELLABLE_ORDER_STATUSES = new Set<string>([
  'pending_payment',
  'payment_verified',
  'processing',
  'pick_list_generated',
]);

export type BuyerCancelOrderOptions = {
  /** From GET /master/order-settings `cancellation_window_hours` (buyer cancel enforces this). */
  cancellationWindowHours?: number;
};

/**
 * Whether the buyer may call `PUT /customer/orders/:id/cancel` or dealer equivalent.
 * Mirrors `cancelOrderByCustomerService` → `finaliseCancellation` with `enforceWindow: true`.
 */
export function canBuyerCancelOrder(order: Order, opts?: BuyerCancelOrderOptions): boolean {
  const status = String(order.status ?? '').trim();
  if (!BUYER_CANCELLABLE_ORDER_STATUSES.has(status)) return false;

  const windowH = opts?.cancellationWindowHours;
  if (windowH == null || !Number.isFinite(windowH) || windowH <= 0) {
    return true;
  }
  try {
    const placedMs = new Date(order.createdAt).getTime();
    const hoursSince = (Date.now() - placedMs) / (1000 * 60 * 60);
    return hoursSince <= windowH;
  } catch {
    return true;
  }
}
