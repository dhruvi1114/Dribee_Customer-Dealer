import { useQuery } from '@tanstack/react-query';

import { apiService } from '@/services/api/apiService';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';

interface RawCouponValidation {
  valid: boolean;
  message?: string;
  discount_amount?: number;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discount?: number;
  message?: string;
}

export function useValidateCoupon(code: string, orderTotal: number) {
  const trimmed = code.trim().toUpperCase();
  return useQuery({
    queryKey: ['coupons', 'validate', trimmed, orderTotal],
    queryFn: async (): Promise<CouponValidation> => {
      const raw = await apiService.get<RawCouponValidation>(
        API_ENDPOINTS.COUPONS.VALIDATE(trimmed, orderTotal),
      );
      return {
        valid: raw.valid,
        code: trimmed,
        discount: raw.discount_amount,
        message: raw.message,
      };
    },
    enabled: trimmed.length >= 3 && orderTotal > 0,
    retry: false,
    staleTime: 60_000,
  });
}
