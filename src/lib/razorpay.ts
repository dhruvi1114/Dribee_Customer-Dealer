import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  TurboModuleRegistry,
} from 'react-native';
import type { TurboModule } from 'react-native';

import { logger } from '@/lib/logger';

// react-native-razorpay@3.0.0's own JS layer fails to bind in bridgeless +
// new architecture (its `RazorpayCheckoutModule` resolves to null even though
// the TurboModule is registered). We bypass it and talk to the native module
// directly. On Android, payment events are emitted via the global
// RCTDeviceEventEmitter (no dedicated event-emitter module exists), so we
// listen with DeviceEventEmitter. On iOS the package ships a dedicated
// RazorpayEventEmitter RCTEventEmitter, so we wrap it with NativeEventEmitter.
interface RazorpayNativeSpec extends TurboModule {
  open(options: Object): void;
}
interface RazorpayEventEmitterSpec extends TurboModule {
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const checkoutModule =
  TurboModuleRegistry.get<RazorpayNativeSpec>('RNRazorpayCheckout') ??
  (NativeModules.RNRazorpayCheckout as RazorpayNativeSpec | null);

const iosEventEmitterModule =
  Platform.OS === 'ios'
    ? (TurboModuleRegistry.get<RazorpayEventEmitterSpec>('RazorpayEventEmitter') ??
       (NativeModules.RazorpayEventEmitter as RazorpayEventEmitterSpec | null))
    : null;

const razorpayEvents =
  Platform.OS === 'android'
    ? DeviceEventEmitter
    : iosEventEmitterModule
      ? new NativeEventEmitter(iosEventEmitterModule)
      : null;

logger.info('Razorpay native diagnostics', {
  platform: Platform.OS,
  checkoutModule_truthy: !!checkoutModule,
  eventsAttached: !!razorpayEvents,
});

export interface RazorpayOpenOptions {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  themeColor?: string;
}

export interface RazorpayCheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayCancelledError extends Error {
  constructor() {
    super('Payment cancelled');
    this.name = 'RazorpayCancelledError';
  }
}

export const openRazorpayCheckout = (
  opts: RazorpayOpenOptions,
): Promise<RazorpayCheckoutResult> => {
  return new Promise((resolve, reject) => {
    if (!checkoutModule || !razorpayEvents) {
      reject(new Error('Razorpay native module is not available. Rebuild the app.'));
      return;
    }
    let successSub: { remove: () => void } | null = null;
    let errorSub: { remove: () => void } | null = null;
    const cleanup = () => {
      successSub?.remove();
      errorSub?.remove();
      successSub = null;
      errorSub = null;
    };
    successSub = razorpayEvents.addListener(
      'Razorpay::PAYMENT_SUCCESS',
      (data: RazorpayCheckoutResult) => {
        cleanup();
        resolve(data);
      },
    );
    errorSub = razorpayEvents.addListener('Razorpay::PAYMENT_ERROR', (err: unknown) => {
      cleanup();
      const e = err as { code?: number | string; description?: string; reason?: string };
      const code = e?.code;
      if (code === 0 || code === 2 || e?.reason === 'payment_cancelled') {
        logger.info('Razorpay checkout cancelled by user', e);
        reject(new RazorpayCancelledError());
        return;
      }
      // Log full error so the exact code+description is visible in Metro logs.
      logger.warn('Razorpay checkout error', { code: e?.code, description: e?.description, reason: e?.reason, raw: JSON.stringify(err) });
      reject(err);
    });
    checkoutModule.open({
      key: opts.keyId,
      order_id: opts.razorpayOrderId,
      amount: opts.amount,
      currency: opts.currency,
      name: 'Order Payment',
      description: opts.orderNumber,
      prefill: {
        name: opts.customerName,
        email: opts.customerEmail,
        contact: opts.customerContact,
      },
      theme: { color: opts.themeColor ?? '#6366F1' },
    });
  });
};
