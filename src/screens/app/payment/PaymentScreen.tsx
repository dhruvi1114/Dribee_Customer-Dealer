import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AlertTriangle, Banknote, CreditCard, Upload } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { AnalyticsEvents, track } from '@/lib/analytics';
import { openRazorpayCheckout, RazorpayCancelledError } from '@/lib/razorpay';
import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EMPTY_CART } from '@/services/cart/cart.mappers';
import { useCart, useCheckoutCart } from '@/services/cart/cart.query';
import { queryKeys } from '@/services/react-query/queryKeys';
import { useInitiatePayment, useVerifyPayment, useInitiateBookingPayment } from '@/services/payments/payments.query';
import type { VerifyPaymentResponse } from '@/services/payments/payments.query';
import { useRecordBookingPayment, useBooking, useBookingInvoice } from '@/services/services/services.query';
import { usePaymentMethods } from '@/services/master/master.query';
import { useAppSelector } from '@/store/hooks';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { getApiErrorMessage } from '@/utils/common-functions';
import type { PaymentMethod } from '@/types/master';
import type { ServicesStackParamList } from '@/navigation/types';

const STATUS_BG: Record<string, string> = {
  pending_assignment: '#F59E0B',
  assigned: '#2563EB',
  confirmed: '#2563EB',
  enroute: '#7C3AED',
  in_progress: '#7C3AED',
  parts_pending: '#EA580C',
  completed: '#16A34A',
  cancelled: '#6B7280',
};

type RawPaymentMethod = PaymentMethod & Record<string, unknown>;

function readRawFlag(m: RawPaymentMethod, keys: string[]): unknown {
  for (const k of keys) {
    const v = m[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/** Treats 0/1, booleans, and common string forms like admin panels send. */
function isMasterPaymentMethodEnabled(m: PaymentMethod): boolean {
  const raw = m as RawPaymentMethod;
  const flag = readRawFlag(raw, ['is_active', 'isActive', 'enabled', 'is_enabled']);
  if (flag === undefined) return true;
  if (flag === false || flag === 0) return false;
  const s = String(flag).toLowerCase().trim();
  if (s === 'false' || s === '0' || s === 'no' || s === 'inactive' || s === 'disabled') return false;
  if (s === 'true' || s === '1' || s === 'yes' || s === 'active' || s === 'enabled') return true;
  return true;
}

function normalizedPaymentType(m: PaymentMethod): string {
  const raw = m as RawPaymentMethod;
  const t = raw.type ?? raw.payment_type ?? readRawFlag(raw, ['paymentType', 'code', 'slug']);
  const s = String(t ?? '')
    .toLowerCase()
    .trim();
  if (s) return s;
  const name = String(raw.name ?? '').toLowerCase();
  if (name.includes('cod') || (name.includes('cash') && name.includes('deliver'))) return 'cod';
  if (name.includes('bank') || name.includes('transfer') || name.includes('neft') || name.includes('imps')) return 'manual';
  if (name.includes('online') || name.includes('card') || name.includes('upi') || name.includes('razor')) return 'online';
  return '';
}

function isGatewayLikeType(t: string): boolean {
  if (!t) return false;
  if (['gateway', 'online', 'razorpay', 'card', 'upi', 'netbanking', 'net_banking', 'online_payment'].includes(t)) return true;
  return t.includes('online') || t.includes('gateway') || t.includes('razorpay') || t.includes('card');
}

function isCodLikeType(t: string): boolean {
  if (!t) return false;
  if (['cod', 'cash', 'cash_on_delivery', 'cash-on-delivery', 'cashondelivery'].includes(t)) return true;
  return t.includes('cod') || t.includes('cash on delivery');
}

function isManualLikeType(t: string): boolean {
  if (!t) return false;
  if (['manual', 'transfer', 'bank', 'bank_transfer', 'neft', 'imps', 'upi_transfer'].includes(t)) return true;
  return t.includes('bank') || t.includes('transfer') || t.includes('manual');
}

type Nav = NativeStackNavigationProp<ServicesStackParamList>;
type Route = RouteProp<ServicesStackParamList, 'Payment'>;

export function PaymentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { amount, orderId, bookingId } = route.params;
  const [method, setMethod] = useState<'online' | 'transfer' | 'cod'>('online');
  const checkout = useCheckoutCart();
  const recordBookingPayment = useRecordBookingPayment();
  const initiateBookingGateway = useInitiateBookingPayment();
  const initiateGateway = useInitiatePayment();
  const verifyGateway = useVerifyPayment();
  const queryClient = useQueryClient();
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  const authUser = useAppSelector((s) => s.auth.user);
  const { data: paymentMethods } = usePaymentMethods();
  const activePaymentMethods = useMemo(
    () => (paymentMethods ?? []).filter(isMasterPaymentMethodEnabled),
    [paymentMethods],
  );
  const [isProcessingOnline, setIsProcessingOnline] = useState(false);

  const isBookingPayment = !!bookingId;
  const { data: booking, isLoading: isBookingLoading } = useBooking(bookingId ?? '');
  const invoiceEnabled = isBookingPayment && booking?.status === 'completed';
  const { data: invoice } = useBookingInvoice(bookingId ?? '', { enabled: invoiceEnabled });

  const isCartCheckout = !orderId && !bookingId;

  // Pre-flight: refetch on mount and gate the Pay button on the server's
  // can_order flag plus per-item availability. The cart was last revalidated
  // when the address was set; any drift since then (price/stock changes,
  // warehouse switch, item-level out-of-stock) shows up here.
  const { data: cart, isFetching: isCartFetching } = useCart(isCartCheckout);
  const unavailableItems = useMemo(
    () => (cart?.items ?? []).filter((it) => !it.isAvailable || !it.inStock),
    [cart],
  );
  const cartHasIssue = isCartCheckout && (cart?.canOrder === false || unavailableItems.length > 0);
  const cartIsEmpty = isCartCheckout && (cart?.items.length ?? 0) === 0;

  useEffect(() => {
    if (!isCartCheckout) return;
    track(AnalyticsEvents.BeginCheckout, { value: amount, currency: 'INR' });
    // Fire once when entering checkout. amount is captured at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve concrete payment-method IDs from the master list. Backend expects
  // a numeric payment_method_id at checkout, so map the UI choice to the first
  // available method of the matching type. Types from admin/API are normalized
  // (case, aliases) so enabled methods still match.
  const { gatewayMethodId, manualMethodId, codMethodId } = useMemo(() => {
    const list = activePaymentMethods;
    const findGatewayId = (): number | null => {
      const m = list.find((x) => isGatewayLikeType(normalizedPaymentType(x)));
      return m && Number.isFinite(Number(m.id)) ? Number(m.id) : null;
    };
    const findCodId = (): number | null => {
      const m = list.find((x) => isCodLikeType(normalizedPaymentType(x)));
      return m && Number.isFinite(Number(m.id)) ? Number(m.id) : null;
    };
    const findManualId = (): number | null => {
      const m = list.find((x) => isManualLikeType(normalizedPaymentType(x)));
      return m && Number.isFinite(Number(m.id)) ? Number(m.id) : null;
    };
    return {
      gatewayMethodId: findGatewayId(),
      manualMethodId: findManualId(),
      codMethodId: findCodId(),
    };
  }, [activePaymentMethods]);

  const visibleMethods = useMemo(() => {
    const rows: Array<{
      key: 'online' | 'cod' | 'transfer';
      label: string;
      sub: string;
      Icon: typeof CreditCard;
      available: boolean;
    }> = [
      {
        key: 'online',
        label: 'Pay Online',
        sub: 'Credit/Debit Card, UPI, Net Banking',
        Icon: CreditCard,
        available: gatewayMethodId != null,
      },
      {
        key: 'cod',
        label: 'Cash on Delivery',
        sub: 'Pay in cash when your order arrives',
        Icon: Banknote,
        available: codMethodId != null,
      },
      {
        key: 'transfer',
        label: 'Pay via Bank Transfer',
        sub: 'Upload payment screenshot',
        Icon: Upload,
        available: manualMethodId != null,
      },
    ];
    return rows.filter((r) => r.available);
  }, [gatewayMethodId, codMethodId, manualMethodId]);

  useEffect(() => {
    if (visibleMethods.length === 0) return;
    if (!visibleMethods.some((r) => r.key === method)) {
      setMethod(visibleMethods[0].key);
    }
  }, [visibleMethods, method]);

  // Opens Razorpay then verify. Either: (1) existing order — POST initiate then checkout, or
  // (2) deferred cart checkout — Razorpay ids already returned from POST /cart/checkout.
  const payOnlineForOrder = useCallback(
    async (
      numericOrderId: number | null,
      totalAmount: number,
      fallbackOrderNumber?: string | null,
      deferredFromCheckout?: {
        razorpayOrderId: string;
        razorpayKeyId: string;
        amountPaise: number;
        currency: string;
        receiptLabel: string;
      },
    ) => {
      const init = deferredFromCheckout
        ? {
            razorpay_order_id: deferredFromCheckout.razorpayOrderId,
            razorpay_key_id: deferredFromCheckout.razorpayKeyId,
            amount: deferredFromCheckout.amountPaise,
            currency: deferredFromCheckout.currency,
            order_number: deferredFromCheckout.receiptLabel,
          }
        : await initiateGateway.mutateAsync({ order_id: String(numericOrderId!) });
      const checkoutResult = await openRazorpayCheckout({
        keyId: init.razorpay_key_id,
        razorpayOrderId: init.razorpay_order_id,
        amount: init.amount,
        currency: init.currency,
        orderNumber: init.order_number,
        customerName: authUser?.name,
        customerEmail: authUser?.email,
        customerContact: authUser?.phone,
      });
      const verifyResult: VerifyPaymentResponse = await verifyGateway.mutateAsync({
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
      });
      queryClient.setQueryData(queryKeys.cart.detail(warehouseId), EMPTY_CART);
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      const resolvedOrderId =
        verifyResult.order_id ?? (numericOrderId != null ? String(numericOrderId) : '');
      const resolvedOrderNumber =
        verifyResult.order_number ?? init.order_number ?? (fallbackOrderNumber ?? '') ?? '';
      track(AnalyticsEvents.Purchase, {
        transaction_id: resolvedOrderNumber || resolvedOrderId,
        value: totalAmount,
        currency: 'INR',
        payment_method: 'online',
      });
      Toast.show({ type: 'success', text1: 'Payment successful' });
      navigation.navigate('OrderSuccess', {
        orderId: resolvedOrderId,
        orderNumber: resolvedOrderNumber,
        totalAmount,
        paymentMode: 'online',
      });
    },
    [authUser, initiateGateway, navigation, queryClient, verifyGateway, warehouseId],
  );

  const handlePay = useCallback(async () => {
    const selectedId =
      method === 'online' ? gatewayMethodId : method === 'cod' ? codMethodId : manualMethodId;

    if (isCartCheckout) {
      if (cartIsEmpty) {
        Toast.show({ type: 'error', text1: 'Your cart is empty' });
        return;
      }
      if (cartHasIssue) {
        Toast.show({
          type: 'error',
          text1: 'Some items need attention',
          text2: 'Review your cart before placing the order.',
        });
        return;
      }
      if (selectedId == null) {
        Toast.show({ type: 'error', text1: 'No payment method available' });
        return;
      }
      checkout.mutate(
        { paymentMethodId: selectedId },
        {
          onSuccess: async (res) => {
            if (method === 'transfer') {
              if (res.orderId == null || res.orderNumber == null) {
                Toast.show({ type: 'error', text1: 'Checkout did not return an order' });
                return;
              }
              navigation.navigate('ManualPaymentUpload', {
                amount,
                orderId: String(res.orderId),
                orderNumber: res.orderNumber,
              });
              return;
            }
            if (method === 'online') {
              try {
                setIsProcessingOnline(true);
                if (res.razorpayOrderId && res.razorpayKeyId && res.amount != null) {
                  await payOnlineForOrder(null, res.totalAmount, res.orderNumber, {
                    razorpayOrderId: res.razorpayOrderId,
                    razorpayKeyId: res.razorpayKeyId,
                    amountPaise: res.amount,
                    currency: res.currency ?? 'INR',
                    receiptLabel: res.orderNumber ?? 'Checkout',
                  });
                } else if (res.orderId != null) {
                  await payOnlineForOrder(res.orderId, res.totalAmount, res.orderNumber ?? undefined);
                } else {
                  Toast.show({ type: 'error', text1: 'Invalid checkout response' });
                }
              } catch (err) {
                if (err instanceof RazorpayCancelledError) {
                  Toast.show({
                    type: 'error',
                    text1: 'Payment cancelled',
                    text2: res.orderId == null ? 'Your cart is unchanged — you can try again.' : undefined,
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: getApiErrorMessage(err, 'Payment failed'),
                  });
                }
              } finally {
                setIsProcessingOnline(false);
              }
              return;
            }
            if (res.orderId == null || res.orderNumber == null) {
              Toast.show({ type: 'error', text1: 'Checkout did not return an order' });
              return;
            }
            // COD: order is confirmed; payment collected on delivery.
            navigation.navigate('OrderSuccess', {
              orderId: String(res.orderId),
              orderNumber: res.orderNumber,
              totalAmount: res.totalAmount,
              paymentMode: method,
            });
          },
        },
      );
      return;
    }

    if (method === 'online') {
      if (orderId) {
        const numericOrderId = Number(orderId);
        if (!Number.isFinite(numericOrderId)) {
          Toast.show({ type: 'error', text1: 'Invalid order' });
          return;
        }
        try {
          setIsProcessingOnline(true);
          await payOnlineForOrder(numericOrderId, amount);
        } catch (err) {
          if (err instanceof RazorpayCancelledError) {
            Toast.show({ type: 'error', text1: 'Payment cancelled' });
          } else {
            Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Payment failed') });
          }
        } finally {
          setIsProcessingOnline(false);
        }
      } else if (bookingId) {
        // Service-booking final bill via Razorpay. Same checkout/verify flow
        // as orders, just a different initiate endpoint that reads the
        // amount from the invoice.
        try {
          setIsProcessingOnline(true);
          const init = await initiateBookingGateway.mutateAsync(bookingId);
          const checkoutResult = await openRazorpayCheckout({
            keyId: init.razorpay_key_id,
            razorpayOrderId: init.razorpay_order_id,
            amount: init.amount,
            currency: init.currency,
            orderNumber: init.order_number,
            customerName: authUser?.name,
            customerEmail: authUser?.email,
            customerContact: authUser?.phone,
          });
          await verifyGateway.mutateAsync({
            razorpay_order_id: checkoutResult.razorpay_order_id,
            razorpay_payment_id: checkoutResult.razorpay_payment_id,
            razorpay_signature: checkoutResult.razorpay_signature,
          });
          Toast.show({ type: 'success', text1: 'Payment successful' });
          navigation.popToTop();
        } catch (err) {
          if (err instanceof RazorpayCancelledError) {
            Toast.show({ type: 'error', text1: 'Payment cancelled' });
          } else {
            Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Payment failed') });
          }
        } finally {
          setIsProcessingOnline(false);
        }
      }
    } else if (method === 'cod' && bookingId) {
      // COD on a booking final bill: record the payment immediately as manual.
      // Pro will collect cash on completion; backend marks it confirmed so the
      // bill drops off the customer's screen. Switch to status='pending' here
      // and add a pro-app "Confirm Cash Received" later if you want stricter.
      recordBookingPayment.mutate(
        {
          bookingId,
          data: {
            paymentPhase: 'final_balance',
            amount,
            // 'cod' keeps the payment in pending until the pro confirms cash
            // received on the install visit.
            paymentMethod: 'cod',
          },
        },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Payment recorded — pay the pro on visit' });
            navigation.popToTop();
          },
        },
      );
    } else {
      navigation.navigate('ManualPaymentUpload', { amount, orderId, bookingId });
    }
  }, [
    amount,
    bookingId,
    cartHasIssue,
    cartIsEmpty,
    checkout,
    recordBookingPayment,
    initiateBookingGateway,
    verifyGateway,
    authUser,
    codMethodId,
    gatewayMethodId,
    isCartCheckout,
    manualMethodId,
    method,
    navigation,
    orderId,
    payOnlineForOrder,
  ]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    summaryCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      margin: Spacing.lg,
    },
    summaryTitle: { fontSize: Typography.fsBody, color: colors.textSecondary, marginBottom: Spacing.sm },
    summaryAmount: { fontSize: 28, fontWeight: Typography.fwBold, color: colors.brandNavy },
    invoiceCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      margin: Spacing.lg,
      marginBottom: 0,
    },
    invoiceTitleRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: Spacing.md },
    invoiceTitle: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
    statusBadgeText: { fontSize: 11, fontWeight: Typography.fwSemibold, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    billRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 6 },
    billLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    billValue: { fontSize: Typography.fsBody, color: colors.textPrimary },
    billDivider: { height: 1, backgroundColor: colors.borderDivider, marginVertical: Spacing.sm },
    billTotalLabel: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.textPrimary },
    billTotalValue: { fontSize: 24, fontWeight: Typography.fwBold, color: colors.brandNavy },
    methodTitle: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 2,
      gap: Spacing.md,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: { width: 10, height: 10, borderRadius: 5 },
    methodInfo: { flex: 1 },
    methodName: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    methodSub: { fontSize: Typography.fsLabel, color: colors.textSecondary, marginTop: 2 },
    stickyBar: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: 10,
      backgroundColor: colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: colors.borderDivider,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    warningTextWrap: { flex: 1 },
    warningTitle: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: '#92400E',
    },
    warningBody: {
      fontSize: Typography.fsLabel,
      color: '#78350F',
      marginTop: 2,
    },
    warningAction: {
      marginTop: Spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.md,
      backgroundColor: '#92400E',
    },
    warningActionText: {
      color: '#fff',
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
    },
  });

  const invoiceTotal = invoice ? Number(invoice.total_amount) : null;
  const approvedParts = isBookingPayment ? (booking?.parts ?? []).filter((p) => p.approved) : [];
  const partsTotal = approvedParts.reduce((s, p) => s + p.price * p.qty, 0);
  const fallbackGst = isBookingPayment ? Math.round((partsTotal + (booking?.serviceFee ?? 0)) * 0.18) : 0;
  const fallbackTotal = isBookingPayment ? (booking?.total ?? partsTotal + (booking?.serviceFee ?? 0) + fallbackGst) : amount;
  const resolvedTotal = isBookingPayment ? (invoiceTotal ?? fallbackTotal) : amount;
  const useServerInvoice = !!invoice && Array.isArray(invoice.line_items);

  if (isBookingPayment && isBookingLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Payment" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Payment" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isBookingPayment && booking ? (
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceTitleRow}>
              <Text style={styles.invoiceTitle}>
                {useServerInvoice ? `Invoice ${invoice!.invoice_number}` : 'Bill Breakdown'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_BG[booking.status] ?? '#6B7280') + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_BG[booking.status] ?? '#6B7280' }]}>
                  {booking.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            {useServerInvoice ? (
              <>
                {(invoice!.line_items ?? []).map((line, idx) => (
                  <View key={`${idx}-${line.description}`} style={styles.billRow}>
                    <Text style={styles.billLabel}>{line.description}{line.qty > 1 ? ` × ${line.qty}` : ''}</Text>
                    <Text style={styles.billValue}>₹{Number(line.amount).toLocaleString('en-IN')}</Text>
                  </View>
                ))}
                {Number(invoice!.cgst_amount) + Number(invoice!.sgst_amount) + Number(invoice!.igst_amount) > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>GST</Text>
                    <Text style={styles.billValue}>
                      ₹{(Number(invoice!.cgst_amount) + Number(invoice!.sgst_amount) + Number(invoice!.igst_amount)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={styles.billTotalLabel}>Total</Text>
                  <Text style={styles.billTotalValue}>₹{Number(invoice!.total_amount).toLocaleString('en-IN')}</Text>
                </View>
              </>
            ) : (
              <>
                {approvedParts.map((p) => (
                  <View key={p.id} style={styles.billRow}>
                    <Text style={styles.billLabel}>{p.name} × {p.qty}</Text>
                    <Text style={styles.billValue}>₹{(p.price * p.qty).toLocaleString('en-IN')}</Text>
                  </View>
                ))}
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Service Fee</Text>
                  <Text style={styles.billValue}>₹{(booking.serviceFee ?? 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>GST (18%)</Text>
                  <Text style={styles.billValue}>₹{fallbackGst.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={styles.billTotalLabel}>Total</Text>
                  <Text style={styles.billTotalValue}>₹{resolvedTotal.toLocaleString('en-IN')}</Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Total</Text>
            <Text style={styles.summaryAmount}>₹{amount.toLocaleString('en-IN')}</Text>
          </View>
        )}
        {cartHasIssue ? (
          <View style={styles.warningCard}>
            <AlertTriangle size={20} color="#92400E" strokeWidth={1.5} />
            <View style={styles.warningTextWrap}>
              <Text style={styles.warningTitle}>
                {cartIsEmpty
                  ? 'Your cart is empty'
                  : unavailableItems.length > 0
                    ? `${unavailableItems.length} item${unavailableItems.length === 1 ? '' : 's'} unavailable`
                    : 'Cart needs attention'}
              </Text>
              <Text style={styles.warningBody}>
                {cartIsEmpty
                  ? 'Add items to your cart before checking out.'
                  : 'Prices, stock, or your delivery address may have changed. Review your cart and try again.'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
                style={styles.warningAction}
              >
                <Text style={styles.warningActionText}>Review cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <Text style={styles.methodTitle}>Select Payment Method</Text>
        {visibleMethods.length === 0 ? (
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.fsBody, color: colors.textTertiary }}>
              No payment methods are enabled. Please contact support or try again later.
            </Text>
          </View>
        ) : (
          visibleMethods.map(({ key, label, sub, Icon }) => {
            const selected = method === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.methodCard,
                  {
                    borderColor: selected ? colors.brandNavy : colors.borderCard,
                  },
                ]}
                onPress={() => setMethod(key)}
                activeOpacity={0.85}
              >
                <View style={[styles.radio, { borderColor: selected ? colors.brandNavy : colors.borderInput }]}>
                  {selected && <View style={[styles.radioInner, { backgroundColor: colors.brandNavy }]} />}
                </View>
                <Icon size={22} color={selected ? colors.brandNavy : colors.textSecondary} strokeWidth={1.5} />
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{label}</Text>
                  <Text style={styles.methodSub}>{sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <View style={styles.stickyBar}>
        <PrimaryButton
          height={48}
          label={
            cartHasIssue
              ? 'Review cart'
              : visibleMethods.length === 0
                ? 'No payment method'
                : method === 'online'
                  ? `Pay ₹${(isBookingPayment ? resolvedTotal : amount).toLocaleString('en-IN')}`
                  : method === 'cod'
                    ? isBookingPayment
                      ? `Pay on Visit · ₹${resolvedTotal.toLocaleString('en-IN')}`
                      : `Place Order · ₹${amount.toLocaleString('en-IN')}`
                    : 'Upload Screenshot'
          }
          onPress={cartHasIssue ? () => navigation.goBack() : () => { void handlePay(); }}
          loading={checkout.isPending || isCartFetching || isProcessingOnline}
          disabled={checkout.isPending || isProcessingOnline || visibleMethods.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
