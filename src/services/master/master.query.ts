import { useQuery } from '@tanstack/react-query';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import type {
  MasterCategory,
  MasterBrand,
  ReturnReason,
  PaymentMethod,
  State,
  City,
  Zone,
  Area,
  OrderSettings,
} from '@/types/master';

function mapOrderSettings(raw: unknown): OrderSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const rw = r.return_window_days ?? r.returnWindowDays;
  const cw = r.cancellation_window_hours ?? r.cancellationWindowHours;
  const min = r.min_order_value ?? r.minOrderValue;
  const prefix = r.order_prefix ?? r.orderPrefix;
  const dc = r.delivery_charge_amount ?? r.deliveryChargeAmount;
  const fd = r.free_delivery_within_km ?? r.freeDeliveryWithinKm;
  return {
    id: Number(r.id ?? 0),
    minOrderValue: min !== undefined && min !== null && min !== '' ? Number(min) : undefined,
    orderPrefix: typeof prefix === 'string' ? prefix : undefined,
    returnWindowDays: rw !== undefined && rw !== null && rw !== '' ? Number(rw) : undefined,
    cancellationWindowHours:
      cw !== undefined && cw !== null && cw !== '' ? Number(cw) : undefined,
    deliveryChargeAmount: dc !== undefined && dc !== null && dc !== '' ? Number(dc) : undefined,
    freeDeliveryWithinKm: fd !== undefined && fd !== null && fd !== '' ? Number(fd) : undefined,
  };
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.master.categories(),
    queryFn: () => apiService.get<MasterCategory[]>(API_ENDPOINTS.MASTER.CATEGORIES),
    staleTime: 10 * 60 * 1000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.master.brands(),
    queryFn: () => apiService.get<MasterBrand[]>(API_ENDPOINTS.MASTER.BRANDS),
    staleTime: 10 * 60 * 1000,
  });
}

export function useReturnReasons() {
  return useQuery({
    queryKey: queryKeys.master.returnReasons(),
    queryFn: () => apiService.get<ReturnReason[]>(API_ENDPOINTS.MASTER.RETURN_REASONS),
    staleTime: 10 * 60 * 1000,
  });
}

export function useOrderSettings() {
  return useQuery({
    queryKey: queryKeys.master.orderSettings(),
    queryFn: async () => {
      const raw = await apiService.get<unknown>(API_ENDPOINTS.MASTER.ORDER_SETTINGS);
      return mapOrderSettings(raw);
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.master.paymentMethods(),
    queryFn: () => apiService.get<PaymentMethod[]>(API_ENDPOINTS.MASTER.PAYMENT_METHODS),
    staleTime: 10 * 60 * 1000,
  });
}

export function useStates() {
  return useQuery({
    queryKey: ['master', 'states'],
    queryFn: () => apiService.get<State[]>(API_ENDPOINTS.MASTER.STATES),
    staleTime: 60 * 60 * 1000,
  });
}

export function useCities(state?: string) {
  return useQuery({
    queryKey: [...queryKeys.master.cities(), state],
    queryFn: () =>
      apiService.get<City[]>(`${API_ENDPOINTS.MASTER.CITIES}?state=${encodeURIComponent(state ?? '')}`),
    staleTime: 30 * 60 * 1000,
    enabled: !!state,
  });
}

export function useAllCities() {
  return useQuery({
    queryKey: [...queryKeys.master.cities(), 'all'],
    queryFn: () => apiService.get<City[]>(API_ENDPOINTS.MASTER.CITIES),
    staleTime: 30 * 60 * 1000,
  });
}

export function useZones(cityId?: string) {
  return useQuery({
    queryKey: [...queryKeys.master.zones(), cityId],
    queryFn: () => apiService.get<Zone[]>(API_ENDPOINTS.MASTER.ZONES + (cityId ? `?city_id=${cityId}` : '')),
    staleTime: 30 * 60 * 1000,
    enabled: true,
  });
}

export function useAreas(zoneId?: string) {
  return useQuery({
    queryKey: [...queryKeys.master.areas(), zoneId],
    queryFn: () => apiService.get<Area[]>(API_ENDPOINTS.MASTER.AREAS + (zoneId ? `?zone_id=${zoneId}` : '')),
    staleTime: 30 * 60 * 1000,
    enabled: true,
  });
}
