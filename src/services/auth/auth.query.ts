import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { baseService } from '@/services/api/baseService';
import { apiService } from '@/services/api/apiService';
import { setToken, removeToken } from '@/lib/keychain';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/storeSetup';
import { login, logout, setUser } from '@/store/slices/authSlice';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import { logger } from '@/lib/logger';
import type {
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  SetPasswordRequest,
  DealerRegisterRequest,
  CustomerRegisterRequest,
  AuthUser,
} from '@/types/auth';

/** Maps API user/profile payloads into AuthUser (role + service module flag). */
export function mapAuthUserFromApi(
  raw: AuthUser & { role_name?: string; service_module_enabled?: boolean; dealer_module_enabled?: boolean },
): AuthUser {
  const serviceModuleEnabled =
    raw.service_module_enabled ?? raw.serviceModuleEnabled ?? true;
  const dealerModuleEnabled =
    raw.dealer_module_enabled ?? raw.dealerModuleEnabled ?? true;
  return {
    ...raw,
    role: (raw.role_name ?? raw.role) as AuthUser['role'],
    serviceModuleEnabled,
    dealerModuleEnabled,
  };
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (data: OtpSendRequest) => {
      logger.info('[Auth] Sending OTP', { phone: data.phone });
      const response = await apiService.post<OtpSendResponse>(API_ENDPOINTS.AUTH.OTP_SEND, data);
      const meta = response as unknown as Record<string, unknown>;
      logger.info('[Auth] OTP send raw response', {
        phone: data.phone,
        role: meta?.role ?? meta?.user_role ?? 'unknown (backend did not return)',
        delivery: meta?.delivery ?? 'unknown',
        message: meta?.message,
        full: response,
      });
      return response;
    },
    onSuccess: (data) => {
      logger.info('[Auth] OTP sent successfully', data);
      const preview =
        data?.otpPreview ??
        (data as { otp?: string; otp_code?: string; preview?: string })?.otp ??
        (data as { otp_code?: string })?.otp_code ??
        (data as { preview?: string })?.preview;
      if (preview) {
        logger.warn(`[Auth] DEV OTP CODE: ${preview}`);
      }
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to send OTP');
      logger.error('[Auth] Send OTP failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useVerifyOtp() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (data: OtpVerifyRequest) => {
      logger.info('[Auth] Verifying OTP');
      return apiService.post<OtpVerifyResponse>(API_ENDPOINTS.AUTH.OTP_VERIFY, data);
    },
    onSuccess: async (data) => {
      logger.info('[Auth] OTP verified, user logged in', {
        role: data.user?.role,
        phone: data.user?.phone,
        email: data.user?.email,
        user: data.user,
      });
      // Customer app is for customers and dealer_owners only. If a pro
      // or admin account verifies here, reject before storing the token
      // so the customer-only screens don't sit on a session they can't use.
      const allowed = ['customer', 'dealer_owner'];
      if (data.user?.role && !allowed.includes(data.user.role)) {
        Toast.show({
          type: 'error',
          text1: 'Wrong app',
          text2: 'This account is not for the customer app. Please use the provider app.',
        });
        return;
      }
      await setToken(data.token);
      dispatch(login(mapAuthUserFromApi(data.user)));
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Invalid OTP');
      logger.error('[Auth] OTP verification failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useSetPassword() {
  return useMutation({
    mutationFn: (data: SetPasswordRequest) => {
      logger.info('[Auth] Setting password');
      return apiService.post(API_ENDPOINTS.AUTH.SET_PASSWORD, data);
    },
    onSuccess: () => {
      logger.info('[Auth] Password set successfully');
      Toast.show({ type: 'success', text1: 'Password set successfully' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to set password');
      logger.error('[Auth] Set password failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useRegisterDealer() {
  return useMutation({
    mutationFn: (data: DealerRegisterRequest) => {
      logger.info('[Auth] Registering dealer', data);
      return apiService.post(API_ENDPOINTS.DEALER.REGISTER, data);
    },
    onSuccess: (data, variables) => {
      logger.info('[Auth] Dealer registered successfully', {
        role: 'dealer',
        phone: variables.phone,
        email: variables.email,
        request: variables,
        response: data,
      });
      Toast.show({ type: 'success', text1: 'Account created! Verify your phone.' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Registration failed');
      logger.error('[Auth] Dealer registration failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useRegisterCustomer() {
  return useMutation({
    mutationFn: (data: CustomerRegisterRequest) => {
      logger.info('[Auth] Registering customer', data);
      return apiService.post(API_ENDPOINTS.CUSTOMER.REGISTER, data);
    },
    onSuccess: (data, variables) => {
      logger.info('[Auth] Customer registered successfully', {
        role: 'customer',
        phone: variables.phone,
        email: variables.email,
        request: variables,
        response: data,
      });
      Toast.show({ type: 'success', text1: 'Account created! Verify your phone.' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Registration failed');
      logger.error('[Auth] Customer registration failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: () => {
      logger.info('[Auth] Logging out');
      return baseService.post(API_ENDPOINTS.AUTH.LOGOUT);
    },
    onSuccess: async () => {
      logger.info('[Auth] Logout successful');
      await removeToken();
      dispatch(logout());
    },
    onError: async (err) => {
      logger.error('[Auth] Logout failed, clearing session anyway', err);
      await removeToken();
      dispatch(logout());
    },
  });
}

export async function fetchMe(): Promise<AuthUser> {
  return apiService.get<AuthUser>(API_ENDPOINTS.AUTH.ME);
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city_id?: string;
  zone_id?: string;
  area_id?: string;
  bank_details?: {
    upi_id?: string | null;
    account_holder?: string | null;
    account_number?: string | null;
    ifsc?: string | null;
  };
}

export function useUpdateProfile() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => {
      logger.info('[Auth] Updating profile', data);
      return apiService.put<AuthUser>(API_ENDPOINTS.AUTH.ME_UPDATE, data);
    },
    onSuccess: (data) => {
      logger.info('[Auth] Profile updated', data);
      const user = mapAuthUserFromApi(data);
      dispatch(setUser(user));
      queryClient.setQueryData<AuthUser>(queryKeys.auth.profile(), user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      Toast.show({ type: 'success', text1: 'Profile updated successfully' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to update profile');
      logger.error('[Auth] Profile update failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useUploadAvatar() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageUri: string) => {
      logger.info('[Auth] Uploading avatar');
      const form = new FormData();
      form.append('avatar', { uri: imageUri, type: 'image/jpeg', name: 'avatar.jpg' } as never);
      return baseService.post(API_ENDPOINTS.AUTH.ME_AVATAR, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      const body = res.data as { data?: { avatar?: string; user?: AuthUser } };
      const avatarUrl =
        body?.data?.avatar ?? (body?.data as { avatar_url?: string } | undefined)?.avatar_url;
      const prev = store.getState().auth.user;
      if (avatarUrl && prev) {
        dispatch(setUser({ ...prev, avatar: avatarUrl }));
        queryClient.setQueryData<AuthUser>(queryKeys.auth.profile(), (old) =>
          old ? { ...old, avatar: avatarUrl } : old,
        );
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      logger.info('[Auth] Avatar uploaded');
      Toast.show({ type: 'success', text1: 'Profile photo updated' });
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, 'Failed to upload photo');
      logger.error('[Auth] Avatar upload failed', msg);
      Toast.show({ type: 'error', text1: msg });
    },
  });
}

export function useProfile() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async () => {
      logger.info('[Auth] Fetching profile');
      const raw = await fetchMe() as AuthUser & { role_name?: string; service_module_enabled?: boolean };
      const user = mapAuthUserFromApi(raw);
      dispatch(setUser(user));
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
