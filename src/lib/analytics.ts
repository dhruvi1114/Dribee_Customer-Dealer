import { logger } from '@/lib/logger';

// Best-effort wrapper around Firebase Analytics. Reads warehouseId from the
// Redux store on every call so revenue / engagement events are pre-segmented
// by the user's active warehouse without each call site having to remember.
//
// Firebase initialization is deferred to a later phase. Until then, every
// track() call falls into the catch and no-ops — the app never crashes from a
// missing Firebase native module, and once init lands, events flow through
// automatically with no further changes at call sites.

type AnalyticsValue = string | number | boolean | null | undefined;
type EventParams = Record<string, AnalyticsValue>;

const getWarehouseIdFromStore = (): number | null => {
  try {
    // Lazy require to avoid a circular dependency with the redux store at
    // module load. Mirrors the pattern used in baseService.ts.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { store } = require('@/store/storeSetup') as typeof import('@/store/storeSetup');
    const state = store.getState() as { location?: { warehouseId: number | null } };
    return state.location?.warehouseId ?? null;
  } catch {
    return null;
  }
};

// Canonical event names. Firebase reserves a few names (purchase,
// add_to_cart, view_item, etc.) — we follow those where applicable so the GA4
// e-commerce reports light up.
export const AnalyticsEvents = {
  ViewProduct: 'view_item',
  AddToCart: 'add_to_cart',
  RemoveFromCart: 'remove_from_cart',
  ApplyCoupon: 'apply_coupon',
  BeginCheckout: 'begin_checkout',
  Purchase: 'purchase',
  Reorder: 'reorder',
  WarehouseChanged: 'warehouse_changed',
  CartRepricedOnWarehouseChange: 'cart_repriced_on_warehouse_change',
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export const track = (event: AnalyticsEvent | string, params: EventParams = {}): void => {
  const warehouseId = getWarehouseIdFromStore();
  const merged: EventParams = { ...params, warehouse_id: warehouseId };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const mod = require('@react-native-firebase/analytics') as { default: () => any };
    void mod.default().logEvent(event, merged);
  } catch (err) {
    logger.warn('[analytics] track failed', err);
  }
};
