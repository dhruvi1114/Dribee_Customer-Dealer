import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import {
  CartChangedSheet,
  type CartChangedSheetHandle,
} from '@/components/cart/CartChangedSheet';
import { AnalyticsEvents, track } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { useAddresses } from '@/services/addresses/addresses.query';
import { useSetCartAddress } from '@/services/cart/cart.query';
import { useAppDispatch } from '@/store/hooks';
import { resolveWarehouseThunk } from '@/store/slices/locationSlice';

import type { ReactNode } from 'react';
import type { CartAddressSwitchResult } from '@/types/cart';

interface PresentArgs {
  result: CartAddressSwitchResult;
  // Address id to revert to when the user taps "Switch back". Optional —
  // omit when the previous address is unknown (e.g. fresh GPS resolve).
  previousAddressId?: number | null;
}

interface CartChangedSheetContextValue {
  present: (args: PresentArgs) => void;
  dismiss: () => void;
}

const CartChangedSheetContext = createContext<CartChangedSheetContextValue | null>(null);

// Mounts CartChangedSheet once at the app root and exposes present/dismiss
// via useCartChangedSheet(). The "Switch back" action is handled inside the
// provider by re-issuing the address mutation against the previous address —
// callers don't need to wire revert logic themselves.
export function CartChangedSheetProvider({ children }: { children: ReactNode }) {
  const handleRef = useRef<CartChangedSheetHandle | null>(null);
  const dispatch = useAppDispatch();
  const { data: addresses } = useAddresses();
  const setCartAddress = useSetCartAddress();

  const handleReady = useCallback((h: CartChangedSheetHandle) => {
    handleRef.current = h;
  }, []);

  const handleSwitchBack = useCallback(
    (previousAddressId: number) => {
      const addr = addresses?.find((a) => Number(a.id) === previousAddressId);
      if (!addr) {
        logger.warn('[CartChangedSheet] previous address not found', { previousAddressId });
        return;
      }
      if (addr.pincode) {
        void dispatch(
          resolveWarehouseThunk({
            pincode: addr.pincode,
            source: 'address',
            addressId: addr.id,
            label: addr.label ?? addr.address_line,
          }),
        );
      }
      // Fire silently — the sheet is already dismissed, so we don't surface
      // the revert's own diff (which would just be the inverse of the change
      // the user explicitly chose to undo).
      setCartAddress.mutate({ deliveryAddressId: previousAddressId });
    },
    [addresses, dispatch, setCartAddress],
  );

  const value = useMemo<CartChangedSheetContextValue>(
    () => ({
      present: (args) => {
        track(AnalyticsEvents.CartRepricedOnWarehouseChange, {
          previous_warehouse_id: args.result.diff.previousWarehouseId,
          new_warehouse_id: args.result.diff.newWarehouseId,
          dropped_count: args.result.diff.droppedItems.length,
          price_change_count: args.result.diff.priceChanges.length,
          removed_coupon: args.result.diff.removedCoupon,
        });
        handleRef.current?.present(args);
      },
      dismiss: () => handleRef.current?.dismiss(),
    }),
    [],
  );

  return (
    <CartChangedSheetContext.Provider value={value}>
      {children}
      <CartChangedSheet onHandleReady={handleReady} onSwitchBack={handleSwitchBack} />
    </CartChangedSheetContext.Provider>
  );
}

export const useCartChangedSheet = (): CartChangedSheetContextValue => {
  const ctx = useContext(CartChangedSheetContext);
  if (!ctx) throw new Error('useCartChangedSheet must be used inside CartChangedSheetProvider');
  return ctx;
};
