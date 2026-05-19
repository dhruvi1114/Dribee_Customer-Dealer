import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import { logger } from '@/lib/logger';
import { useAppSelector } from '@/store/hooks';
import type { CreateAddressRequest, CustomerAddress, UpdateAddressRequest } from '@/types/address';

const ROLES_WITH_ADDRESSES = ['customer', 'dealer_owner', 'dealer_staff'] as const;
type RoleWithAddress = (typeof ROLES_WITH_ADDRESSES)[number];

export function useAddresses() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const role = useAppSelector((s) => s.auth.user?.role);
  return useQuery({
    queryKey: queryKeys.addresses.list(),
    queryFn: () => apiService.get<CustomerAddress[]>(API_ENDPOINTS.CUSTOMER.ADDRESSES),
    enabled: isAuthenticated && ROLES_WITH_ADDRESSES.includes(role as RoleWithAddress),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressRequest) =>
      apiService.post<CustomerAddress>(API_ENDPOINTS.CUSTOMER.ADDRESSES, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.addresses.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      Toast.show({ type: 'success', text1: 'Address added successfully' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to add address');
      logger.error('[Addresses] Create failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressRequest }) =>
      apiService.put<CustomerAddress>(API_ENDPOINTS.CUSTOMER.ADDRESS_DETAIL(id), data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.addresses.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      Toast.show({ type: 'success', text1: 'Address updated successfully' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to update address');
      logger.error('[Addresses] Update failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiService.put<CustomerAddress>(API_ENDPOINTS.CUSTOMER.ADDRESS_DEFAULT(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.addresses.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      Toast.show({ type: 'success', text1: 'Default address updated' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to set default');
      logger.error('[Addresses] Set default failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiService.delete<{ id: string }>(API_ENDPOINTS.CUSTOMER.ADDRESS_DETAIL(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.addresses.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      Toast.show({ type: 'success', text1: 'Address deleted' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to delete address');
      logger.error('[Addresses] Delete failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}
