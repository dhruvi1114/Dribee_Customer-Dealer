import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { baseService } from '@/services/api/baseService';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';

// ─── Initiate (creates a Razorpay order on the server) ───────────────────────

export interface InitiatePaymentRequest {
  order_id: string;
}

export interface InitiatePaymentResponse {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
  order_number: string;
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (data: InitiatePaymentRequest) =>
      baseService
        .post<{ data: InitiatePaymentResponse }>(API_ENDPOINTS.PAYMENTS.INITIATE_GATEWAY, data)
        .then((r) => r.data.data),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to initiate payment') });
    },
  });
}

// ─── Initiate gateway for a service-booking final bill ──────────────────────
// Same response shape as the order-based initiate above; reuses the existing
// Razorpay client + verify path on the customer.

export function useInitiateBookingPayment() {
  return useMutation({
    mutationFn: (bookingId: string) =>
      baseService
        .post<{ data: InitiatePaymentResponse }>(API_ENDPOINTS.PAYMENTS.INITIATE_BOOKING_GATEWAY(bookingId))
        .then((r) => r.data.data),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to initiate payment') });
    },
  });
}

// ─── Verify (sends Razorpay checkout result back for HMAC verification) ──────

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  payment_id: number;
  status: string;
  /** Present after deferred cart checkout verify (API uses snake_case). */
  order_id?: string;
  order_number?: string;
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: (data: VerifyPaymentRequest) =>
      baseService
        .post<{ data: VerifyPaymentResponse }>(API_ENDPOINTS.PAYMENTS.VERIFY_GATEWAY, data)
        .then((r) => r.data.data),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Payment verification failed') });
    },
  });
}

// ─── Manual proof upload ─────────────────────────────────────────────────────

export interface ManualPaymentUploadRequest {
  orderId?: string;
  bookingId?: string;
  amount: number;
  proofUri: string;
}

export function useUploadManualPayment() {
  return useMutation({
    mutationFn: ({ uri, data }: { uri: string; data: ManualPaymentUploadRequest }) => {
      const form = new FormData();
      form.append('proof', { uri, name: 'proof.jpg', type: 'image/jpeg' } as unknown as Blob);
      if (data.orderId) form.append('orderId', data.orderId);
      if (data.bookingId) form.append('bookingId', data.bookingId);
      form.append('amount', String(data.amount));
      return baseService.post(API_ENDPOINTS.PAYMENTS.UPLOAD_MANUAL, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Payment proof uploaded successfully' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to upload payment proof') });
    },
  });
}
