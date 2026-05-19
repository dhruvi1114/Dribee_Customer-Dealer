export type LocationPermissionStatus = 'unknown' | 'granted' | 'denied' | 'blocked';

export type WarehouseResolutionSource = 'single' | 'pincode' | 'nearest' | null;

export interface ResolvedWarehouse {
  warehouseId: number | null;
  source: WarehouseResolutionSource;
  canOrder: boolean;
  warehouse: { id: number; name: string; code: string | null } | null;
  distanceKm: number | null;
}

export interface FulfillingWarehouse {
  id: number;
  name: string;
  distance_km: number | null;
  delivery_charge: number;
  is_primary: boolean;
}

export interface CartShipment {
  warehouse_id: number;
  warehouse_name: string;
  distance_km: number | null;
  delivery_charge: number;
  shipment_subtotal: number;
}
