import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import type { DealerProfile, UpdateDealerProfileRequest } from '@/types/dealer';

export function useDealerProfile() {
  return useQuery({
    queryKey: queryKeys.dealer.profile(),
    queryFn: () => apiService.get<DealerProfile>(API_ENDPOINTS.DEALER.PROFILE),
  });
}

export function useUpdateDealerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDealerProfileRequest) =>
      apiService.put<DealerProfile>(API_ENDPOINTS.DEALER.PROFILE, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dealer.profile() });
      Toast.show({ type: 'success', text1: 'Profile updated successfully' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to update profile') });
    },
  });
}
