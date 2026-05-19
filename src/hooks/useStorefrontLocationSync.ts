import { useEffect, useRef } from 'react';

import { logger } from '@/lib/logger';
import { useAppSelector } from '@/store/hooks';
import { usePushStorefrontLocation } from '@/services/storefront/storefront.query';

// Pushes the resolved GPS coordinates to the backend so the storefront can
// scope products and pricing to the user's warehouse. Fires once per resolved
// (lat,lng) pair to avoid redundant network calls.
export const useStorefrontLocationSync = (): void => {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const lat = useAppSelector((s) => s.location.latitude);
  const lng = useAppSelector((s) => s.location.longitude);
  const pincode = useAppSelector((s) => s.location.pincode);
  const resolveStatus = useAppSelector((s) => s.location.resolveStatus);

  const pushLocation = usePushStorefrontLocation();
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (resolveStatus !== 'resolved') return;
    if (lat == null || lng == null) return;

    const key = `${lat.toFixed(4)}:${lng.toFixed(4)}:${pincode ?? ''}`;
    if (lastSentRef.current === key) return;
    lastSentRef.current = key;

    pushLocation.mutate(
      { latitude: lat, longitude: lng, pincode: pincode ?? undefined },
      {
        onError: (err) => logger.warn('[StorefrontLocationSync] push failed', err),
      },
    );
  }, [isAuthenticated, lat, lng, pincode, resolveStatus, pushLocation]);
};
