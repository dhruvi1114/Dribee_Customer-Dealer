import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { AnalyticsEvents, track } from '@/lib/analytics';
import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { useAppSelector } from '@/store/hooks';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import {
  EMPTY_CART,
  mapCartAddressSwitchResult,
  mapCartView,
  mapCheckoutResult,
  type RawCartAddressSwitchResult,
  type RawCartView,
} from '@/services/cart/cart.mappers';
import type {
  ServerCart,
  AddCartItemRequest,
  UpdateCartItemRequest,
  SetCartAddressRequest,
  SetCartCouponRequest,
  CheckoutCartRequest,
  CheckoutCartResponse,
  CartAddressSwitchResult,
} from '@/types/cart';

const fetchCart = async (): Promise<ServerCart> => {
  const raw = await apiService.get<RawCartView>(API_ENDPOINTS.CART.GET);
  return mapCartView(raw);
};

export function useCart(enabled = true) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useQuery({
    queryKey: queryKeys.cart.detail(warehouseId),
    queryFn: fetchCart,
    enabled,
    staleTime: 30_000,
    placeholderData: EMPTY_CART,
  });
}

export function useAddCartItem() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useMutation({
    mutationFn: async (data: AddCartItemRequest) => {
      const raw = await apiService.post<RawCartView>(API_ENDPOINTS.CART.ADD_ITEM, {
        variant_id: String(data.variantId),
        qty: data.qty,
      });
      return mapCartView(raw);
    },
    onSuccess: (cart, variables) => {
      qc.setQueryData(queryKeys.cart.detail(warehouseId), cart);
      track(AnalyticsEvents.AddToCart, {
        variant_id: variables.variantId,
        quantity: variables.qty,
      });
      Toast.show({ type: 'success', text1: 'Added to cart' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to add to cart') });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  const cartKey = queryKeys.cart.detail(warehouseId);
  return useMutation({
    mutationFn: async ({ variantId, qty }: { variantId: number; qty: number }) => {
      const raw = await apiService.put<RawCartView>(
        API_ENDPOINTS.CART.UPDATE_ITEM(variantId),
        { qty } satisfies UpdateCartItemRequest,
      );
      return mapCartView(raw);
    },
    onMutate: async ({ variantId, qty }) => {
      await qc.cancelQueries({ queryKey: cartKey });
      const prev = qc.getQueryData<ServerCart>(cartKey);
      if (prev) {
        qc.setQueryData<ServerCart>(cartKey, {
          ...prev,
          items: prev.items.map((it) =>
            it.variantId === variantId ? { ...it, qty } : it,
          ),
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(cartKey, ctx.prev);
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to update item') });
    },
    onSuccess: (cart) => qc.setQueryData(cartKey, cart),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useMutation({
    mutationFn: async (variantId: number) => {
      const raw = await apiService.delete<RawCartView>(API_ENDPOINTS.CART.REMOVE_ITEM(variantId));
      return mapCartView(raw);
    },
    onSuccess: (cart, variantId) => {
      qc.setQueryData(queryKeys.cart.detail(warehouseId), cart);
      track(AnalyticsEvents.RemoveFromCart, { variant_id: variantId });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to remove item') });
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useMutation({
    mutationFn: async () => {
      const raw = await apiService.delete<RawCartView>(API_ENDPOINTS.CART.CLEAR);
      return mapCartView(raw);
    },
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.detail(warehouseId), cart),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to clear cart') });
    },
  });
}

// Switching the cart's delivery address re-resolves the warehouse on the
// server: items may be dropped (no price / no stock at the new warehouse),
// prices may change, and the coupon may be invalidated. The mutation result
// carries the full diff so callers can render a confirmation sheet when
// anything material changed.
export function useSetCartAddress() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useMutation<CartAddressSwitchResult, unknown, SetCartAddressRequest>({
    mutationFn: async (data) => {
      const raw = await apiService.put<RawCartAddressSwitchResult>(
        API_ENDPOINTS.CART.SET_ADDRESS,
        { delivery_address_id: String(data.deliveryAddressId) },
      );
      return mapCartAddressSwitchResult(raw);
    },
    onSuccess: (result) => {
      qc.setQueryData(queryKeys.cart.detail(warehouseId), result.cart);
      // Also seed the cache entry under the new warehouse id so the next read
      // doesn't briefly serve stale data while the cart query refetches.
      if (result.diff.newWarehouseId !== null && result.diff.newWarehouseId !== warehouseId) {
        qc.setQueryData(queryKeys.cart.detail(result.diff.newWarehouseId), result.cart);
      }
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to set address') });
    },
  });
}

// True when an address switch produced user-visible changes that should be
// surfaced via the CartChangedSheet.
export const hasMaterialDiff = (result: CartAddressSwitchResult): boolean =>
  result.diff.droppedItems.length > 0 ||
  result.diff.priceChanges.length > 0 ||
  result.diff.removedCoupon !== null;

export interface ReorderItem {
  variantId: number;
  qty: number;
  name: string;
}

export interface ReorderResult {
  addedCount: number;
  failed: Array<{ variantId: number; name: string; reason: string }>;
}

// Adds each item from a past order back to the user's persistent cart by
// looping POST /cart/items. Sequential rather than parallel so the backend
// re-evaluates volume slabs as each line is added. Items that don't exist /
// aren't priced / aren't in stock at the user's current warehouse fail
// individually; survivors still land in the cart.
export function useReorderFromOrder() {
  const qc = useQueryClient();
  return useMutation<ReorderResult, unknown, ReorderItem[]>({
    mutationFn: async (items) => {
      const failed: ReorderResult['failed'] = [];
      let addedCount = 0;
      for (const item of items) {
        try {
          await apiService.post<RawCartView>(API_ENDPOINTS.CART.ADD_ITEM, {
            variant_id: String(item.variantId),
            qty: item.qty,
          });
          addedCount += 1;
        } catch (err) {
          failed.push({
            variantId: item.variantId,
            name: item.name,
            reason: getApiErrorMessage(err, 'Could not add'),
          });
        }
      }
      return { addedCount, failed };
    },
    onSuccess: ({ addedCount, failed }) => {
      track(AnalyticsEvents.Reorder, {
        added_count: addedCount,
        failed_count: failed.length,
      });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}

export function useSetCartCoupon() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useMutation({
    mutationFn: async (data: SetCartCouponRequest) => {
      const raw = await apiService.put<RawCartView>(API_ENDPOINTS.CART.SET_COUPON, {
        coupon_code: data.couponCode,
      });
      return mapCartView(raw);
    },
    onSuccess: (cart, variables) => {
      qc.setQueryData(queryKeys.cart.detail(warehouseId), cart);
      track(AnalyticsEvents.ApplyCoupon, { coupon_code: variables.couponCode });
      Toast.show({ type: 'success', text1: 'Coupon applied' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Invalid coupon') });
    },
  });
}

export function useRemoveCartCoupon() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useMutation({
    mutationFn: async () => {
      const raw = await apiService.delete<RawCartView>(API_ENDPOINTS.CART.REMOVE_COUPON);
      return mapCartView(raw);
    },
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.detail(warehouseId), cart),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to remove coupon') });
    },
  });
}

export function useCheckoutCart() {
  const qc = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useMutation({
    mutationFn: async (data: CheckoutCartRequest): Promise<CheckoutCartResponse> => {
      const raw = await apiService.post<Parameters<typeof mapCheckoutResult>[0]>(
        API_ENDPOINTS.CART.CHECKOUT,
        { payment_method_id: String(data.paymentMethodId) },
      );
      return mapCheckoutResult(raw);
    },
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      // Gateway: cart stays until Razorpay succeeds (server + PaymentScreen).
      if (res.nextStep === 'processing') {
        qc.setQueryData(queryKeys.cart.detail(warehouseId), EMPTY_CART);
        void qc.invalidateQueries({ queryKey: queryKeys.cart.all });
        track(AnalyticsEvents.Purchase, {
          transaction_id: res.orderNumber,
          value: res.totalAmount,
          currency: 'INR',
          payment_method: res.paymentMethod.name,
        });
        Toast.show({ type: 'success', text1: 'Order placed successfully' });
      }
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Checkout failed') });
    },
  });
}
