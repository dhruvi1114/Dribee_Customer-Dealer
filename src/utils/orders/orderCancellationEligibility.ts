import type { Order } from '@/types/order';

/**
 * Order rows the backend allows through `cancelOrderById` (customer/dealer self-cancel).
 * @see `cancelOrderById` in `order.repository.ts` — any other status yields `ORDER_NOT_CANCELLABLE`.
 */
export const PRE_DISPATCH_STATUSES = new Set<string>([
  'pending_payment',
  'payment_verified',
  'processing',
  'pick_list_generated',
]);

export const POST_DISPATCH_STATUSES = new Set<string>(['dispatched', 'delivered']);

export type BuyerCancelOrderOptions = {
  cancellationWindowDays?: number;
  allowCancelPreDispatch?: boolean;
  allowCancelPostDispatch?: boolean;
};

/**
 * Whether the buyer may call `PUT /customer/orders/:id/cancel` or dealer equivalent.
 * Mirrors backend `finaliseCancellation` policy checks exactly.
 */
export function canBuyerCancelOrder(order: Order, opts?: BuyerCancelOrderOptions): boolean {
  const status = String(order.status ?? '').trim();
  const isPreDispatch = PRE_DISPATCH_STATUSES.has(status);
  const isPostDispatch = POST_DISPATCH_STATUSES.has(status);

  if (!isPreDispatch && !isPostDispatch) return false;

  if (isPreDispatch) {
    if (opts?.allowCancelPreDispatch === false) return false;
    const windowD = opts?.cancellationWindowDays;
    if (windowD != null && Number.isFinite(windowD) && windowD > 0) {
      try {
        const daysSince = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > windowD) return false;
      } catch {
        // ignore parse errors
      }
    }
    return true;
  }

  // post-dispatch / delivered
  return opts?.allowCancelPostDispatch === true;
}
