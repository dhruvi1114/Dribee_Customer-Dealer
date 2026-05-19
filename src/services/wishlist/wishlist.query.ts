import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import {
  EMPTY_WISHLIST,
  mapWishlistView,
  type RawWishlistView,
} from '@/services/wishlist/wishlist.mappers';
import type { AddWishlistItemRequest, Wishlist } from '@/types/wishlist';

const fetchWishlist = async (): Promise<Wishlist> => {
  const raw = await apiService.get<RawWishlistView>(API_ENDPOINTS.WISHLIST.GET);
  return mapWishlistView(raw);
};

export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wishlist.detail(),
    queryFn: fetchWishlist,
    enabled,
    staleTime: 30_000,
    placeholderData: EMPTY_WISHLIST,
  });
}

export function useIsInWishlist(variantId: number | null | undefined) {
  const { data } = useWishlist();
  return useMemo(() => {
    if (variantId == null || !data) return false;
    return data.items.some((it) => it.variantId === variantId);
  }, [data, variantId]);
}

export function useAddWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddWishlistItemRequest): Promise<Wishlist> => {
      const raw = await apiService.post<RawWishlistView>(API_ENDPOINTS.WISHLIST.ADD_ITEM, {
        variant_id: String(data.variantId),
      });
      return mapWishlistView(raw);
    },
    onMutate: async ({ variantId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.wishlist.detail() });
      const prev = qc.getQueryData<Wishlist>(queryKeys.wishlist.detail());
      if (prev && !prev.items.some((it) => it.variantId === variantId)) {
        qc.setQueryData<Wishlist>(queryKeys.wishlist.detail(), {
          ...prev,
          items: [
            ...prev.items,
            {
              variantId,
              displayName: '',
              productId: 0,
              productName: '',
              images: [],
              addedAt: new Date().toISOString(),
            },
          ],
          count: prev.count + 1,
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.wishlist.detail(), ctx.prev);
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to add to wishlist') });
    },
    onSuccess: (wishlist) => {
      qc.setQueryData(queryKeys.wishlist.detail(), wishlist);
      Toast.show({ type: 'success', text1: 'Added to wishlist' });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist.all }),
  });
}

export function useRemoveWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variantId: number): Promise<Wishlist> => {
      const raw = await apiService.delete<RawWishlistView>(
        API_ENDPOINTS.WISHLIST.REMOVE_ITEM(variantId),
      );
      return mapWishlistView(raw);
    },
    onMutate: async (variantId) => {
      await qc.cancelQueries({ queryKey: queryKeys.wishlist.detail() });
      const prev = qc.getQueryData<Wishlist>(queryKeys.wishlist.detail());
      if (prev) {
        qc.setQueryData<Wishlist>(queryKeys.wishlist.detail(), {
          ...prev,
          items: prev.items.filter((it) => it.variantId !== variantId),
          count: Math.max(0, prev.count - 1),
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.wishlist.detail(), ctx.prev);
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(err, 'Failed to remove from wishlist'),
      });
    },
    onSuccess: (wishlist) => qc.setQueryData(queryKeys.wishlist.detail(), wishlist),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist.all }),
  });
}

export function useClearWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<Wishlist> => {
      const raw = await apiService.delete<RawWishlistView>(API_ENDPOINTS.WISHLIST.CLEAR);
      return mapWishlistView(raw);
    },
    onSuccess: (wishlist) => {
      qc.setQueryData(queryKeys.wishlist.detail(), wishlist);
      Toast.show({ type: 'success', text1: 'Wishlist cleared' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to clear wishlist') });
    },
  });
}
