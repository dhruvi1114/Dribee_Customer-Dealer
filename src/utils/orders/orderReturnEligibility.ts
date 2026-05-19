import type { Order } from '@/types/order';

export type ReturnEligibilityOptions = {
  /**
   * From GET /master/order-settings when the order payload has no
   * `returnWindowDays` (e.g. list rows). Order detail already embeds the same
   * `order_settings.return_window_days` value from the server.
   */
  settingsReturnWindowDays?: number;
};

/** Prefer order row (detail/list when present), then tenant order settings. */
export function resolveEffectiveReturnWindowDays(
  order: Order,
  opts?: ReturnEligibilityOptions,
): number | undefined {
  if (order.returnWindowDays != null && Number.isFinite(order.returnWindowDays)) {
    return order.returnWindowDays;
  }
  const fromSettings = opts?.settingsReturnWindowDays;
  if (fromSettings != null && Number.isFinite(fromSettings)) {
    return fromSettings;
  }
  return undefined;
}

/**
 * Mirrors backend `createReturn` window check: days since delivery timestamp
 * vs configured `return_window_days` (order payload or order settings).
 */
export function isReturnWindowExpired(order: Order, opts?: ReturnEligibilityOptions): boolean {
  const windowDays = resolveEffectiveReturnWindowDays(order, opts);
  if (windowDays === undefined) return false;
  const deliveredAt = order.deliveredAt;
  if (!deliveredAt) return false;
  try {
    const ms = Date.now() - new Date(deliveredAt).getTime();
    const daysSince = ms / (1000 * 60 * 60 * 24);
    return daysSince > windowDays;
  } catch {
    return false;
  }
}

export type ReturnButtonState = {
  show: boolean;
  disabled: boolean;
  hint?: string;
};

/**
 * `show` means the order is in a return-related state (e.g. delivered). `disabled`
 * means the user must not start a new return. UI should **hide** the Return button
 * when `disabled` is true and only surface `hint` on the order detail screen where helpful.
 */
export function getReturnButtonState(order: Order, opts?: ReturnEligibilityOptions): ReturnButtonState {
  if (order.status === 'returned') {
    return {
      show: true,
      disabled: true,
      hint: 'This order has already been returned.',
    };
  }
  if (order.status === 'return_requested') {
    return {
      show: true,
      disabled: true,
      hint: 'A return is already in progress for this order.',
    };
  }
  if (order.status !== 'delivered') {
    return { show: false, disabled: true };
  }
  if (isReturnWindowExpired(order, opts)) {
    const d = resolveEffectiveReturnWindowDays(order, opts);
    return {
      show: true,
      disabled: true,
      hint:
        d !== undefined
          ? `Returns must be raised within ${d} days of delivery.`
          : 'The return period for this order has ended.',
    };
  }
  return { show: true, disabled: false };
}
