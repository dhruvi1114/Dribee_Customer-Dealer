import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import {
  LocationSetupSheet,
  type LocationSetupSheetHandle,
} from '@/components/location/LocationSetupSheet';

import type { ReactNode } from 'react';

interface LocationSheetContextValue {
  open: () => void;
  close: () => void;
}

const LocationSheetContext = createContext<LocationSheetContextValue | null>(null);

// Mounts LocationSetupSheet once and exposes open/close via useLocationSheet().
export function LocationSheetProvider({ children }: { children: ReactNode }) {
  const handleRef = useRef<LocationSetupSheetHandle | null>(null);

  const handleReady = useCallback((h: LocationSetupSheetHandle) => {
    handleRef.current = h;
  }, []);

  const value = useMemo<LocationSheetContextValue>(
    () => ({
      open: () => handleRef.current?.present(),
      close: () => handleRef.current?.dismiss(),
    }),
    [],
  );

  return (
    <LocationSheetContext.Provider value={value}>
      {children}
      <LocationSetupSheet onHandleReady={handleReady} />
    </LocationSheetContext.Provider>
  );
}

export const useLocationSheet = (): LocationSheetContextValue => {
  const ctx = useContext(LocationSheetContext);
  if (!ctx) throw new Error('useLocationSheet must be used inside LocationSheetProvider');
  return ctx;
};
