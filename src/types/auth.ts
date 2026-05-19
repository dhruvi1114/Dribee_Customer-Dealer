import type { CustomerAddress } from './address';

export type UserRole =
  | 'dealer_owner'
  | 'dealer_staff'
  | 'customer'
  | 'superadmin'
  | 'admin'
  | 'manager'
  | 'sales_staff'
  | 'finance'
  | 'pro';

export type DealerStatus = 'pending' | 'approved' | 'rejected';

export interface BankDetails {
  upi_id?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  ifsc?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  role_name?: string;
  orgSlug: string;
  dealerStatus?: DealerStatus;
  businessName?: string;
  avatar?: string;
  address?: string;
  city_id?: string;
  zone_id?: string;
  area_id?: string;
  city_name?: string;
  zone_name?: string;
  state_name?: string;
  area_name?: string;
  bank_details?: BankDetails | null;
  addresses?: CustomerAddress[];
  /** When false, hide service booking UI (from tenant module_config). */
  serviceModuleEnabled?: boolean;
  /** When false, dealer cannot access service booking even if serviceModuleEnabled is true. */
  dealerModuleEnabled?: boolean;
}

export interface OtpSendRequest {
  phone: string;
}

export interface OtpSendResponse {
  message: string;
  otpPreview?: string;
}

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
}

export interface OtpVerifyResponse {
  token: string;
  user: AuthUser;
  requiresPasswordSetup?: boolean;
}

export interface SetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface DealerRegisterRequest {
  business_name: string;
  phone: string;
  email: string;
  gst_number?: string;
  address?: string;
}

export interface CustomerRegisterRequest {
  name: string;
  phone: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
