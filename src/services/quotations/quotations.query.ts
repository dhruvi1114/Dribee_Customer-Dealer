import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import type { Quotation, QuotationListParams, RejectQuoteRequest } from '@/types/quotation';

export function useQuotations(params?: QuotationListParams) {
  return useQuery({
    queryKey: queryKeys.quotes.list(params as Record<string, unknown>),
    queryFn: () =>
      apiService.getPaginated<Quotation[]>(API_ENDPOINTS.QUOTES.LIST, { params }),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: queryKeys.quotes.detail(id),
    queryFn: () => apiService.get<Quotation>(API_ENDPOINTS.QUOTES.DETAIL(id)),
    enabled: !!id,
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiService.put(API_ENDPOINTS.QUOTES.ACCEPT(id)),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      Toast.show({ type: 'success', text1: 'Quote accepted' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to accept quote') });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectQuoteRequest }) =>
      apiService.put(API_ENDPOINTS.QUOTES.REJECT(id), data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all });
      Toast.show({ type: 'success', text1: 'Quote rejected' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to reject quote') });
    },
  });
}
