import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { resolveWarehouseRequest } from '@/services/warehouses/warehouses.service';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { LocationPermissionStatus, ResolvedWarehouse } from '@/types/location';

export type DeliveryAddressSource = 'gps' | 'manual' | 'profile' | 'address';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  pincode: string | null;
  permissionStatus: LocationPermissionStatus;
  warehouseId: number | null;
  warehouseName: string | null;
  source: ResolvedWarehouse['source'];
  canOrder: boolean;
  distanceKm: number | null;
  resolveStatus: 'idle' | 'resolving' | 'resolved' | 'failed';
  resolveError: string | null;
  lastResolvedAt: number | null;
  // How the current delivery address was chosen. When 'gps', foreground
  // movement automatically re-resolves; for any other source, the user's
  // explicit choice is preserved regardless of GPS changes.
  deliveryAddressSource: DeliveryAddressSource | null;
  deliveryAddressLabel: string | null;
  // The saved customer-address id currently driving the session. Set when the
  // user picks a saved address; null when on GPS / manual pincode.
  selectedAddressId: string | null;
}

const initialState: LocationState = {
  latitude: null,
  longitude: null,
  pincode: null,
  permissionStatus: 'unknown',
  warehouseId: null,
  warehouseName: null,
  source: null,
  canOrder: false,
  distanceKm: null,
  resolveStatus: 'idle',
  resolveError: null,
  lastResolvedAt: null,
  deliveryAddressSource: null,
  deliveryAddressLabel: null,
  selectedAddressId: null,
};

export const resolveWarehouseThunk = createAsyncThunk<
  ResolvedWarehouse & {
    deliveryAddressSource?: DeliveryAddressSource;
    deliveryAddressLabel?: string;
    selectedAddressId?: string | null;
    pincode?: string | null;
  },
  {
    lat?: number;
    lng?: number;
    pincode?: string;
    source?: DeliveryAddressSource;
    label?: string;
    addressId?: string | null;
  },
  { rejectValue: string }
>('location/resolveWarehouse', async (payload, { rejectWithValue }) => {
  try {
    const result = await resolveWarehouseRequest({
      lat: payload.lat,
      lng: payload.lng,
      pincode: payload.pincode,
    });
    return {
      ...result,
      deliveryAddressSource: payload.source,
      deliveryAddressLabel: payload.label,
      selectedAddressId: payload.addressId ?? null,
      pincode: payload.pincode ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resolve warehouse';
    return rejectWithValue(message);
  }
});

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCoords(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.latitude = action.payload.lat;
      state.longitude = action.payload.lng;
    },
    setPincode(state, action: PayloadAction<string | null>) {
      state.pincode = action.payload;
    },
    setSelectedAddressId(state, action: PayloadAction<string | null>) {
      state.selectedAddressId = action.payload;
    },
    setPermissionStatus(state, action: PayloadAction<LocationPermissionStatus>) {
      state.permissionStatus = action.payload;
    },
    clearLocation() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resolveWarehouseThunk.pending, (state) => {
        state.resolveStatus = 'resolving';
        state.resolveError = null;
      })
      .addCase(resolveWarehouseThunk.fulfilled, (state, action) => {
        const r = action.payload;
        state.resolveStatus = 'resolved';
        state.warehouseId = r.warehouseId;
        state.warehouseName = r.warehouse?.name ?? null;
        state.source = r.source;
        state.canOrder = r.canOrder;
        state.distanceKm = r.distanceKm;
        state.lastResolvedAt = Date.now();
        if (r.deliveryAddressSource) {
          state.deliveryAddressSource = r.deliveryAddressSource;
        }
        if (r.deliveryAddressLabel !== undefined) {
          state.deliveryAddressLabel = r.deliveryAddressLabel;
        }
        if (r.pincode !== null && r.pincode !== undefined) {
          state.pincode = r.pincode;
        }
        if (r.deliveryAddressSource === 'address') {
          state.selectedAddressId = r.selectedAddressId ?? null;
          // Clear any stale GPS coords so they don't get synced to the backend
          // while the session is driven by a saved address.
          state.latitude = null;
          state.longitude = null;
        } else if (r.deliveryAddressSource) {
          // Switching to GPS / manual / profile clears the saved-address pick.
          state.selectedAddressId = null;
        }
      })
      .addCase(resolveWarehouseThunk.rejected, (state, action) => {
        state.resolveStatus = 'failed';
        state.resolveError = action.payload ?? 'Failed to resolve warehouse';
      });
  },
});

export const { setCoords, setPincode, setSelectedAddressId, setPermissionStatus, clearLocation } =
  locationSlice.actions;
export default locationSlice.reducer;
