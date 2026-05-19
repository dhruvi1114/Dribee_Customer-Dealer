import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import ToastMessage from 'react-native-toast-message';

import { store, persistor } from '@/store/storeSetup';
import { queryClient } from '@/services/react-query/queryClient';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { toastConfig } from '@/components/shared/Toast';
import { EnvBadge } from '@/components/shared/EnvBadge';
import { ThemeProvider } from '@/theme/ThemeContext';
import { LocationSheetProvider } from '@/components/location/LocationSheetProvider';
import { CartChangedSheetProvider } from '@/components/cart/CartChangedSheetProvider';

import type { ReactNode } from 'react';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <BottomSheetModalProvider>
                <SafeAreaProvider>
                  <CartChangedSheetProvider>
                    <LocationSheetProvider>
                      {children}
                    </LocationSheetProvider>
                  </CartChangedSheetProvider>
                  <EnvBadge />
                  <ToastMessage config={toastConfig} />
                </SafeAreaProvider>
              </BottomSheetModalProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
