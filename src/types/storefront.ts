export interface StorefrontLocationRequest {
  latitude: number;
  longitude: number;
  pincode?: string;
}

export interface DeliveryContext {
  canDeliver: boolean;
  warehouseId: number | null;
  warehouseName: string | null;
  estimatedDays?: number;
  message?: string;
}
