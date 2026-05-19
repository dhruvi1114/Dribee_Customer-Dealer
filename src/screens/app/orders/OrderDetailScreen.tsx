import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Download } from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import { format, parseISO } from 'date-fns';
import Toast from 'react-native-toast-message';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useReorderFromOrder } from '@/services/cart/cart.query';
import { useOrder, useCancelOrder } from '@/services/orders/orders.query';
import { useOrderSettings } from '@/services/master/master.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { OrdersStackParamList } from '@/navigation/types';
import { getReturnButtonState } from '@/utils/orders/orderReturnEligibility';
import { canBuyerCancelOrder } from '@/utils/orders/orderCancellationEligibility';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;
type Route = RouteProp<OrdersStackParamList, 'OrderDetail'>;

export function OrderDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;

  const { data: order, isLoading } = useOrder(orderId);
  const { data: orderSettings } = useOrderSettings();
  const reorder = useReorderFromOrder();
  const cancelOrder = useCancelOrder();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleInvoice = useCallback(() => {
    navigation.navigate('Invoice', { orderId });
  }, [navigation, orderId]);

  const handleReorder = useCallback(() => {
    if (!order || order.items.length === 0) return;
    const items = order.items.map((it) => ({
      variantId: it.variantId,
      qty: it.qty,
      name: it.name,
    }));
    reorder.mutate(items, {
      onSuccess: ({ addedCount, failed }) => {
        if (addedCount === 0) {
          Toast.show({
            type: 'error',
            text1: 'Could not reorder',
            text2: 'None of the items are available for your delivery address.',
          });
          return;
        }
        if (failed.length > 0) {
          Toast.show({
            type: 'info',
            text1: `${addedCount} item${addedCount === 1 ? '' : 's'} added to cart`,
            text2: `${failed.length} unavailable for your address.`,
          });
        } else {
          Toast.show({
            type: 'success',
            text1: `${addedCount} item${addedCount === 1 ? '' : 's'} added to cart`,
          });
        }
        navigation.navigate('Cart');
      },
    });
  }, [navigation, order, reorder]);

  const returnState = order
    ? getReturnButtonState(order, { settingsReturnWindowDays: orderSettings?.returnWindowDays })
    : { show: false, disabled: true };

  const canCancel = order
    ? canBuyerCancelOrder(order, { cancellationWindowHours: orderSettings?.cancellationWindowHours })
    : false;

  const handleReturn = useCallback(() => {
    if (!order) return;
    navigation.navigate('ReturnSelectItems', { orderId: order.id });
  }, [navigation, order]);

  const handleOpenCancelDialog = useCallback(() => {
    if (!order || !canCancel) return;
    setCancelDialogOpen(true);
  }, [order, canCancel]);

  const handleConfirmCancelOrder = useCallback(() => {
    if (!order) return;
    cancelOrder.mutate(
      { orderId: order.id },
      {
        onSuccess: () => {
          setCancelDialogOpen(false);
          navigation.goBack();
        },
        onError: () => {
          setCancelDialogOpen(false);
        },
      },
    );
  }, [order, cancelOrder, navigation]);

  const itemCount = order?.items.reduce((sum, item) => sum + (item.qty ?? 0), 0) ?? 0;
  const dateTimeText = (() => {
    if (!order) return '';
    try {
      return format(parseISO(order.createdAt), "dd MMM''yy, h:mm a");
    } catch {
      return order.createdAt;
    }
  })();
  const timeText = (() => {
    if (!order) return '';
    try {
      return format(parseISO(order.createdAt), 'h:mm a');
    } catch {
      return '';
    }
  })();
  const mrp = order ? order.subtotal : 0;
  const couponDiscount = order ? order.discount : 0;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    body: { paddingBottom: 120 },
    section: {
      backgroundColor: colors.bgCard,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.borderDivider,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    title: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.textPrimary, marginTop: Spacing.xs },
    subtitle: { fontSize: Typography.fsBody, color: colors.textSecondary, marginTop: 2 },
    invoiceLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: Spacing.sm,
      alignSelf: 'flex-start',
    },
    invoiceText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.statusDelivered },
    sectionTitle: { fontSize: Typography.fsScreen, fontWeight: Typography.fwBold, color: colors.textPrimary, marginBottom: Spacing.md },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
    },
    thumbWrap: {
      width: 56,
      height: 56,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgSection,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: colors.borderDivider,
    },
    thumbText: { fontWeight: Typography.fwBold, color: colors.brandNavy, opacity: 0.5 },
    thumbImage: { width: 56, height: 56 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwSemibold },
    itemMeta: { fontSize: Typography.fsBody, color: colors.textSecondary, marginTop: 2 },
    itemPrice: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwSemibold },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    rowLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    rowValue: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwSemibold },
    discountText: { color: colors.brandBlue },
    billTotalLabel: { fontSize: Typography.fsScreen, fontWeight: Typography.fwBold, color: colors.textPrimary },
    billTotalValue: { fontSize: Typography.fsScreen, fontWeight: Typography.fwBold, color: colors.textPrimary },
    detailLabel: { fontSize: Typography.fsBody, color: colors.textTertiary, marginTop: Spacing.sm },
    detailValue: { fontSize: Typography.fsBody, color: colors.textPrimary, marginTop: 2 },
    footer: {
      position: 'absolute',
      backgroundColor: colors.bgCard,
      left: 0,
      right: 0,
      bottom: 0,
      borderTopWidth: 1,
      borderTopColor: colors.borderDivider,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
    },
    footerRow: { flexDirection: 'row', gap: Spacing.sm },
    footerActionSlot: { flex: 1, minWidth: 0 },
    returnHint: {
      fontSize: Typography.fsLabel,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
  });

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Order summary" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Order summary" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.section}>
          <Text style={styles.title}>Order summary</Text>
          <Text style={styles.subtitle}>{order.status === 'delivered' ? `Arrived at ${timeText}` : `Ordered at ${timeText}`}</Text>
          <TouchableOpacity style={styles.invoiceLink} activeOpacity={0.8} onPress={handleInvoice}>
            <Text style={styles.invoiceText}>Download Invoice</Text>
            <Download size={16} color={colors.statusDelivered} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{itemCount} items in this order</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.thumbWrap}>
                {item.image ? (
                  <FastImage source={{ uri: item.image }} style={styles.thumbImage} resizeMode={FastImage.resizeMode.cover} />
                ) : (
                  <Text style={styles.thumbText}>
                    {(item.name || '').slice(0, 2).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.variant || 'Variant'} x {item.qty}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.total.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill details</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>MRP</Text>
            <Text style={styles.rowValue}>₹{mrp.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>GST</Text>
            <Text style={styles.rowValue}>₹{order.gst.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, styles.discountText]}>Coupon discount</Text>
            <Text style={[styles.rowValue, styles.discountText]}>
              {couponDiscount > 0 ? `-₹${couponDiscount.toLocaleString('en-IN')}` : '₹0'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.billTotalLabel}>Bill total</Text>
            <Text style={styles.billTotalValue}>₹{order.total.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order details</Text>
          <Text style={styles.detailLabel}>Order id</Text>
          <Text style={styles.detailValue}>{order.orderNumber}</Text>
          <Text style={styles.detailLabel}>Payment</Text>
          <Text style={styles.detailValue}>{order.paymentMethod?.trim() || 'Cash on delivery'}</Text>
          <Text style={styles.detailLabel}>Deliver to</Text>
          <Text style={styles.detailValue}>{order.address?.trim() || 'Address not available'}</Text>
          <Text style={styles.detailLabel}>Order placed</Text>
          <Text style={styles.detailValue}>{dateTimeText}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.footerActionSlot}>
            <PrimaryButton
              height={52}
              label="Repeat Order"
              onPress={handleReorder}
              disabled={reorder.isPending || order.items.length === 0}
              loading={reorder.isPending}
            />
          </View>
          {canCancel ? (
            <View style={styles.footerActionSlot}>
              <PrimaryButton
                height={52}
                label="Cancel"
                variant="outlined"
                color={colors.statusReturned}
                onPress={handleOpenCancelDialog}
              />
            </View>
          ) : null}
          {returnState.show && !returnState.disabled ? (
            <View style={styles.footerActionSlot}>
              <PrimaryButton
                height={52}
                label="Return"
                variant="outlined"
                color={colors.statusReturned}
                onPress={handleReturn}
              />
            </View>
          ) : null}
        </View>
        {returnState.hint && (!returnState.show || returnState.disabled) ? (
          <Text style={styles.returnHint}>{returnState.hint}</Text>
        ) : null}
      </View>
      <ConfirmDialog
        visible={cancelDialogOpen}
        title="Cancel this order?"
        message="You can cancel while the order is still being prepared and within the store cancellation window."
        dismissLabel="Keep order"
        confirmLabel="Cancel order"
        destructive
        loading={cancelOrder.isPending}
        onDismiss={() => {
          if (!cancelOrder.isPending) setCancelDialogOpen(false);
        }}
        onConfirm={handleConfirmCancelOrder}
      />
    </SafeAreaView>
  );
}
