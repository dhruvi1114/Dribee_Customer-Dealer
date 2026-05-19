export type BookingStatus =
  | 'pending_assignment'
  | 'assigned'
  | 'confirmed'
  | 'enroute'
  | 'in_progress'
  | 'awaiting_parts'
  | 'parts_ready'
  | 'parts_pending'
  | 'ready_to_resume'
  | 'completed'
  | 'cancelled';

export interface RequestRevisitRequest {
  slot_date: string;
  slot_start_time: string;
  notes?: string;
}

export interface RequestRevisitResponse {
  revisit_booking_id: string;
}

export type BookingPriority = 'normal' | 'urgent';

export interface ServiceCatalogueItem {
  id: string;
  name: string;
  description?: string;
  base_fee: number;
  slot_duration_mins?: number;
  machine_type?: string;
  service_type_id?: string;
  service_type_name?: string;
  gst_rate?: number;
  is_active: boolean;
}

export interface BookingPro {
  id: string;
  name: string;
  phone: string;
  rating?: number;
}

export interface JobPart {
  id: string;
  name: string;
  price: number;
  qty: number;
  available: boolean;
  approved?: boolean;
}

export type PartsListStatus = 'draft' | 'sent' | 'locked';

export interface Booking {
  id: string;
  bookingId: string;
  serviceName: string;
  serviceId: number;
  serviceTypeName?: string;
  machineType?: string;
  scheduledDate: string;
  timeSlot?: string;
  status: BookingStatus;
  priority: BookingPriority;
  address: string;
  pro?: BookingPro;
  otp?: string;
  parts?: JobPart[];
  serviceFee: number;
  gstRate?: number;
  total?: number;
  notes?: string;
  jobId?: string;
  // Backend returns service_jobs.id under this key in booking detail. Used as
  // the :id for /service/jobs/:id/parts/* endpoints.
  service_job_id?: string;
  rating?: number;
  cancellationReason?: string;
  // Phase 4: customer/dealer can hit "Place Order" once the pro's parts list
  // has been approved (parts_list_status === 'locked'). Once an order has been
  // placed, parts_order_id is set and the button must hide.
  parts_list_status?: PartsListStatus;
  parts_order_id?: string | null;
  continuation_visit?: boolean;
  payment_collected?: string | number | null;
}

export interface CreateBookingRequest {
  catalogueId: number;
  zoneId: number;
  areaId?: number;
  priority: BookingPriority;
  slotDate: string;        // 'YYYY-MM-DD'
  slotStartTime: string;   // ISO datetime 'YYYY-MM-DDTHH:MM:SS'
  customerAddress: string;
  serviceLat?: number;
  serviceLng?: number;
  tcAccepted: true;
}

export interface BookingListParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  customerId?: string;
}


export interface CancelBookingRequest {
  reason: string;
}

export interface ApprovePartsRequest {
  approvedPartIds: string[];
  rejectedPartIds?: string[];
}

export interface RateJobRequest {
  rating: number;
  comment?: string;
}

export interface GenerateOtpResponse {
  otp: string;
}

export type BookingPaymentPhase = 'available_parts' | 'out_of_stock_parts' | 'final_balance';
export type BookingPaymentMethod = 'gateway' | 'manual' | 'cod';

// Phase 6 — single consolidated tax_invoice generated on job completion.
// Customer pays once against this total.
export interface ServiceInvoiceLineItem {
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
}

export interface ServiceInvoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  service_booking_id: string;
  customer_id: string;
  subtotal: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  total_amount: string;
  line_items: ServiceInvoiceLineItem[] | null;
  pdf_url?: string | null;
  created_at: string;
}

export interface RecordBookingPaymentRequest {
  paymentPhase: BookingPaymentPhase;
  amount: number;
  paymentMethod: BookingPaymentMethod;
  gatewayOrderId?: string;
  reference?: string;
}
