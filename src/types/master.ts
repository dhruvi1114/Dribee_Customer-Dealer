export interface MasterCategory {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  imageUrl?: string;
}

export interface MasterBrand {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface ReturnReason {
  id: number;
  reason: string;
  is_active?: boolean;
  isActive?: boolean;
}

export interface State {
  name: string;
}

export interface City {
  id: number;
  name: string;
  state: string;
}

export interface Zone {
  id: number;
  name: string;
  city_id: number;
  city_name?: string;
}

export interface Area {
  id: number;
  name: string;
  zone_id: number;
  zone_name?: string;
  pincode?: string;
}

export interface PaymentMethod {
  id: number | string;
  name: string;
  type: 'gateway' | 'manual' | 'online' | 'cod';
  /** Admin toggle (camelCase from API or client) */
  isActive?: boolean;
  /** Admin toggle (snake_case from API) */
  is_active?: boolean;
  /** Some APIs use a separate field for the discriminator */
  payment_type?: string;
}

/** Tenant order policy from `order_settings` (GET /master/order-settings). */
export interface OrderSettings {
  id: number;
  minOrderValue?: number;
  orderPrefix?: string;
  /** Admin-configured return window in days — same source as order detail `return_window_days`. */
  returnWindowDays?: number;
  /** Hours after `placed_at` during which the buyer may cancel (`order_settings`). */
  cancellationWindowHours?: number;
  /** Delivery charge applied when distance exceeds freeDeliveryWithinKm (₹). */
  deliveryChargeAmount?: number;
  /** Distance threshold below which delivery is free (km). */
  freeDeliveryWithinKm?: number;
}
