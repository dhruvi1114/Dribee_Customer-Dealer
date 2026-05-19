import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import type { AppStateStatus } from 'react-native';

import { AnalyticsEvents, track } from '@/lib/analytics';
import { getCurrentCoordinates, requestLocationPermission } from '@/lib/geolocation';
import { logger } from '@/lib/logger';
import { useAddresses } from '@/services/addresses/addresses.query';
import { queryKeys } from '@/services/react-query/queryKeys';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  resolveWarehouseThunk,
  setCoords,
  setPermissionStatus,
} from '@/store/slices/locationSlice';

const FOREGROUND_RECHECK_MS = 15 * 60 * 1000;
const SIGNIFICANT_MOVE_KM = 5;

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Kicks off location permission + warehouse resolution when the user is
// authenticated. Safe to mount multiple times — resolution runs at most once
// per authenticated session unless forceRefresh is called.
export const useLocationBootstrap = (): { refresh: () => Promise<void> } => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const resolveStatus = useAppSelector((s) => s.location.resolveStatus);
  const persistedPincode = useAppSelector((s) => s.location.pincode);
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  const lastResolvedAt = useAppSelector((s) => s.location.lastResolvedAt);
  const lastLat = useAppSelector((s) => s.location.latitude);
  const lastLng = useAppSelector((s) => s.location.longitude);
  const deliveryAddressSource = useAppSelector((s) => s.location.deliveryAddressSource);
  const lastAppState = useRef<AppStateStatus>(AppState.currentState);
  const lastInvalidatedWarehouseId = useRef<number | null>(null);

  // Saved addresses drive resolution when present; GPS is only a fallback.
  const { data: addresses, isFetched: addressesFetched } = useAddresses();

  // When the resolved warehouse changes, all warehouse-keyed product/cart data
  // is stale — drop the cache so listings, detail, and cart refetch with new
  // prices and stock for the new warehouse.
  useEffect(() => {
    if (warehouseId === null) return;
    if (lastInvalidatedWarehouseId.current === warehouseId) return;
    const previousWarehouseId = lastInvalidatedWarehouseId.current;
    lastInvalidatedWarehouseId.current = warehouseId;
    void queryClient.invalidateQueries({ queryKey: queryKeys.storefront.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalogue.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    track(AnalyticsEvents.WarehouseChanged, {
      previous_warehouse_id: previousWarehouseId,
      source: deliveryAddressSource,
    });
  }, [warehouseId, queryClient, deliveryAddressSource]);

  const refresh = useCallback(async () => {
    try {
      // Priority 1: default saved address with a pincode.
      const defaultAddr =
        addresses?.find((a) => a.is_default && a.pincode) ??
        addresses?.find((a) => a.pincode) ??
        null;

      if (defaultAddr && defaultAddr.pincode) {
        await dispatch(
          resolveWarehouseThunk({
            pincode: defaultAddr.pincode,
            lat: defaultAddr.latitude ?? undefined,
            lng: defaultAddr.longitude ?? undefined,
            source: 'address',
            addressId: defaultAddr.id,
            label: defaultAddr.label ?? defaultAddr.address_line,
          }),
        );
        return;
      }

      // Priority 2: GPS, when no usable saved address.
      const permission = await requestLocationPermission();
      dispatch(setPermissionStatus(permission));

      if (permission === 'granted') {
        try {
          const coords = await getCurrentCoordinates();
          dispatch(setCoords(coords));
          await dispatch(
            resolveWarehouseThunk({
              lat: coords.lat,
              lng: coords.lng,
              source: 'gps',
              label: 'Current location',
            }),
          );
          return;
        } catch (err) {
          logger.warn('[LocationBootstrap] getCurrentCoordinates failed', err);
        }
      }

      // Priority 3: previously persisted manual pincode.
      if (persistedPincode) {
        await dispatch(
          resolveWarehouseThunk({
            pincode: persistedPincode,
            source: 'manual',
            label: `Pincode ${persistedPincode}`,
          }),
        );
      }
    } catch (err) {
      logger.error('[LocationBootstrap] refresh failed', err);
    }
  }, [dispatch, addresses, persistedPincode]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (resolveStatus === 'resolving' || resolveStatus === 'resolved') return;
    // Wait for the addresses query to finish (fetched OR cache miss returned)
    // before bootstrapping, so we don't fall through to GPS while addresses are
    // still loading.
    if (!addressesFetched) return;
    void refresh();
  }, [isAuthenticated, resolveStatus, addressesFetched, refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const subscription = AppState.addEventListener('change', (next) => {
      const prev = lastAppState.current;
      lastAppState.current = next;
      if (next !== 'active' || prev === 'active') return;
      if (lastResolvedAt === null) return;
      if (Date.now() - lastResolvedAt < FOREGROUND_RECHECK_MS) return;
      // Respect explicit delivery address choices — only re-resolve when the
      // user is currently on GPS-driven delivery.
      if (deliveryAddressSource && deliveryAddressSource !== 'gps') return;

      (async () => {
        try {
          const coords = await getCurrentCoordinates();
          const moved =
            lastLat === null ||
            lastLng === null ||
            haversineKm(lastLat, lastLng, coords.lat, coords.lng) >= SIGNIFICANT_MOVE_KM;
          if (moved) {
            dispatch(setCoords(coords));
            await dispatch(
              resolveWarehouseThunk({
                lat: coords.lat,
                lng: coords.lng,
                source: 'gps',
                label: 'Current location',
              }),
            );
          }
        } catch (err) {
          logger.warn('[LocationBootstrap] foreground recheck failed', err);
        }
      })();
    });
    return () => subscription.remove();
  }, [isAuthenticated, lastResolvedAt, lastLat, lastLng, dispatch, deliveryAddressSource]);

  return { refresh };
};
