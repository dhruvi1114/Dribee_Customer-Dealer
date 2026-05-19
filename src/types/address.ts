export interface CustomerAddress {
  id: string;
  customer_id?: string;
  label: string | null;
  address_line: string;
  landmark: string | null;
  pincode: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  city_id: string | null;
  zone_id: string | null;
  area_id: string | null;
  city_name: string | null;
  zone_name: string | null;
  area_name: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressRequest {
  label?: string;
  address_line: string;
  landmark?: string;
  pincode: string;
  city_id?: string;
  zone_id?: string;
  area_id?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  address_line?: string;
  landmark?: string;
  pincode?: string;
  city_id?: string;
  zone_id?: string;
  area_id?: string;
  latitude?: number;
  longitude?: number;
}
