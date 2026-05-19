import { apiService } from '@/services/api/apiService';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';

import type { ResolvedWarehouse } from '@/types/location';

export interface ResolveWarehousePayload {
  lat?: number;
  lng?: number;
  pincode?: string;
}

export const resolveWarehouseRequest = async (
  payload: ResolveWarehousePayload,
): Promise<ResolvedWarehouse> => {
  const data = await apiService.post<ResolvedWarehouse>(API_ENDPOINTS.WAREHOUSES.RESOLVE, payload);
  return data;
};
