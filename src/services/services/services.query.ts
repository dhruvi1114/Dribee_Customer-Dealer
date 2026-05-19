import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import type {
  Booking,
  BookingListParams,
  ServiceCatalogueItem,
  CreateBookingRequest,
  CancelBookingRequest,
  ApprovePartsRequest,
  RateJobRequest,
  GenerateOtpResponse,
  RecordBookingPaymentRequest,
  ServiceInvoice,
  RequestRevisitRequest,
  RequestRevisitResponse,
} from '@/types/service';

function mapBooking(raw: Record<string, unknown>): Booking {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    bookingId: (r.bookingId as string) ?? (r.booking_id as string) ?? ('BKG-' + String(r.id ?? '').padStart(6, '0')),
    serviceName: (r.serviceName as string) ?? (r.service_name as string) ?? '',
    serviceId: Number(r.serviceId ?? r.service_id ?? r.catalogue_id ?? 0),
    serviceTypeName: (r.serviceTypeName as string) || (r.service_type_name as string) || undefined,
    machineType: (r.machineType as string) || (r.machine_type as string) || undefined,
    scheduledDate: (r.scheduledDate as string) ?? (r.scheduled_date as string) ?? (r.slot_date as string) ?? '',
    timeSlot: (r.timeSlot as string) ?? (r.time_slot as string) ?? (r.slot_start_time as string) ?? undefined,
    status: ((r.status as string) ?? 'pending_assignment') as Booking['status'],
    priority: ((r.priority as string) ?? 'normal') as Booking['priority'],
    address: (r.address as string) ?? (r.customer_address as string) ?? '',
    pro: r.pro_name
      ? { id: String(r.pro_id ?? ''), name: String(r.pro_name ?? ''), phone: String(r.pro_phone ?? '') }
      : (r.pro as Booking['pro']) ?? undefined,
    otp: (r.otp as string) ?? undefined,
    parts: (r.parts as Booking['parts']) ?? undefined,
    serviceFee: Number(r.serviceFee ?? r.service_fee ?? r.price_at_booking ?? 0),
    gstRate: r.gst_rate != null ? Number(r.gst_rate) : undefined,
    total: r.total != null ? Number(r.total) : undefined,
    notes: (r.notes as string) ?? undefined,
    jobId: (r.jobId as string) ?? (r.job_id as string) ?? undefined,
    service_job_id: (r.service_job_id as string) ?? undefined,
    rating: r.rating != null ? Number(r.rating) : undefined,
    cancellationReason: (r.cancellationReason as string) ?? (r.cancellation_reason as string) ?? undefined,
    parts_list_status: (r.parts_list_status as Booking['parts_list_status']) ?? undefined,
    parts_order_id: (r.parts_order_id as string) ?? undefined,
    continuation_visit: (r.continuation_visit as boolean) ?? undefined,
    payment_collected: r.payment_collected as Booking['payment_collected'],
  };
}

export function useServiceCatalogue(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.services.catalogue(),
    queryFn: () => apiService.get<ServiceCatalogueItem[]>(API_ENDPOINTS.SERVICES.CATALOGUE),
    enabled: options?.enabled !== false,
  });
}

export function useBookings(params?: BookingListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.services.bookings(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await apiService.getPaginated<Record<string, unknown>[]>(API_ENDPOINTS.SERVICES.BOOKINGS_LIST, { params });
      return { ...res, data: (res.data ?? []).map(mapBooking) };
    },
    enabled: options?.enabled !== false,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.services.bookingDetail(id),
    queryFn: async () => {
      const raw = await apiService.get<Record<string, unknown>>(API_ENDPOINTS.SERVICES.BOOKING_DETAIL(id));
      return mapBooking(raw);
    },
    enabled: !!id,
  });
}

// Phase 6 — single consolidated invoice generated on job completion. Returns
// 404 until the job is completed; consumers should treat absence as "not yet
// available" and fall back to client-side estimates.
export function useBookingInvoice(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.services.bookingInvoice(id),
    queryFn: () => apiService.get<ServiceInvoice>(API_ENDPOINTS.SERVICES.BOOKING_INVOICE(id)),
    enabled: !!id && options?.enabled !== false,
    retry: false,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingRequest) =>
      apiService.post<Booking>(API_ENDPOINTS.SERVICES.BOOKINGS_CREATE, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      Toast.show({ type: 'success', text1: 'Booking created successfully' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to create booking') });
    },
  });
}

interface CancelBookingResponse {
  refund_id?: string | null;
  refund_amount?: number;
  cancellation_charge?: {
    invoice_id: string;
    invoice_number: string;
    cancellation_charge: number;
    visit_fee: number;
    subtotal: number;
    gst_amount: number;
    total: number;
    fee_label: string;
  } | null;
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelBookingRequest }) =>
      apiService.post<CancelBookingResponse>(API_ENDPOINTS.SERVICES.BOOKING_CANCEL(id), data),
    onSuccess: (data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.bookingDetail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      const charge = data?.cancellation_charge;
      if (charge && charge.total > 0) {
        Toast.show({
          type: 'info',
          text1: 'Booking cancelled',
          text2: `${charge.fee_label} of ₹${charge.total.toLocaleString('en-IN')} (incl. GST) is due. Pay it from your bookings list.`,
        });
      } else {
        Toast.show({ type: 'success', text1: 'Booking cancelled' });
      }
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to cancel booking') });
    },
  });
}

export function useApproveParts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: ApprovePartsRequest }) =>
      apiService.put(API_ENDPOINTS.SERVICES.JOB_PARTS_APPROVE(jobId), data),
    onSuccess: (_, { jobId, data }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.jobDetail(jobId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      const allRejected = data.approvedPartIds.length === 0 && data.rejectedPartIds.length > 0;
      Toast.show({ type: 'success', text1: allRejected ? 'All parts rejected' : 'Parts decision submitted' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to submit parts decision') });
    },
  });
}

// Phase 5 — customer/dealer opts in to a continuation visit when the original
// booking ended in parts_pending / ready_to_resume. Backend creates a new
// service_bookings row (continuation_visit=TRUE, parent_booking_id) and
// returns the new booking id so the UI can navigate to it.
// Resume a booking that's paused on parts. Customer picks a new slot once
// parts have arrived; backend reschedules and notifies the assigned pro.
export function useResumeBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, slot_date, slot_start_time }: { bookingId: string; slot_date: string; slot_start_time: string }) =>
      apiService.post(API_ENDPOINTS.SERVICES.BOOKING_RESUME(bookingId), { slot_date, slot_start_time }),
    onSuccess: (_, { bookingId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.bookingDetail(bookingId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      Toast.show({ type: 'success', text1: 'Resume request sent. Pro will be notified.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to resume booking') });
    },
  });
}

export function useReassignBookingPro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiService.post(API_ENDPOINTS.SERVICES.BOOKING_REASSIGN_PRO(bookingId)),
    onSuccess: (_, bookingId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.bookingDetail(bookingId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      Toast.show({ type: 'success', text1: 'Looking for a different pro…' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to reassign pro') });
    },
  });
}

export function useRequestRevisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data?: RequestRevisitRequest }) =>
      apiService.post<RequestRevisitResponse>(API_ENDPOINTS.SERVICES.BOOKING_REVISIT(bookingId), data ?? {}),
    onSuccess: (_, { bookingId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.bookingDetail(bookingId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      Toast.show({ type: 'success', text1: 'Revisit booked' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to book revisit') });
    },
  });
}

interface PlacePartsOrderResponse {
  order_id: string;
  order_number: string;
  total_amount: number;
}

export function usePlacePartsOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId }: { jobId: string }) =>
      apiService.post<PlacePartsOrderResponse>(API_ENDPOINTS.SERVICES.JOB_PARTS_PLACE_ORDER(jobId)),
    onSuccess: (_, { jobId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.jobDetail(jobId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      Toast.show({ type: 'success', text1: 'Order placed — proceed to payment' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to place order') });
    },
  });
}

export function useRecordBookingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: RecordBookingPaymentRequest }) =>
      apiService.post(API_ENDPOINTS.SERVICES.BOOKING_PAYMENT(bookingId), data),
    onSuccess: (_, { bookingId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.bookingDetail(bookingId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to record payment') });
    },
  });
}

export function useGenerateBookingOtp() {
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiService.post<GenerateOtpResponse>(API_ENDPOINTS.SERVICES.BOOKING_GENERATE_OTP(bookingId)),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to generate OTP') });
    },
  });
}

export function useApproveSinglePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, partId }: { jobId: string; partId: string }) =>
      apiService.put(API_ENDPOINTS.SERVICES.JOB_PART_APPROVE(jobId, partId)),
    onSuccess: (_, { jobId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.jobDetail(jobId) });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to approve part') });
    },
  });
}

export function useRemoveSinglePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, partId }: { jobId: string; partId: string }) =>
      apiService.put(API_ENDPOINTS.SERVICES.JOB_PART_REMOVE(jobId, partId)),
    onSuccess: (_, { jobId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.jobDetail(jobId) });
      Toast.show({ type: 'success', text1: 'Part removed' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to remove part') });
    },
  });
}

export function useRateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: RateJobRequest }) =>
      apiService.post(API_ENDPOINTS.SERVICES.JOB_RATING(jobId), data),
    onSuccess: (_, { jobId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.jobDetail(jobId) });
      Toast.show({ type: 'success', text1: 'Thank you for your rating!' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to submit rating') });
    },
  });
}
