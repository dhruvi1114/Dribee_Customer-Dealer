import { Fragment, useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import { StatusChip } from '@/components/common/StatusChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useOrder, useCancelOrder } from '@/services/orders/orders.query';
import { useOrderSettings } from '@/services/master/master.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { Order } from '@/types/order';
import { getReturnButtonState } from '@/utils/orders/orderReturnEligibility';
import { canBuyerCancelOrder } from '@/utils/orders/orderCancellationEligibility';

interface OrderCardProps {
  order: Order;
  onReorder?: (order: Order) => void;
  onPress?: (order: Order) => void;
  onReturn?: (order: Order) => void;
}

export function OrderCard({ order, onReorder, onPress, onReturn }: OrderCardProps) {
  const { colors } = useTheme();
  const { data: orderDetail } = useOrder(order.id);
  const { data: orderSettings } = useOrderSettings();
  const cancelOrder = useCancelOrder();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const effectiveOrder = useMemo(
    () => ({ ...order, ...(orderDetail ?? {}) }),
    [order, orderDetail],
  );
  const returnState = getReturnButtonState(effectiveOrder, {
    settingsReturnWindowDays: orderSettings?.returnWindowDays,
  });

  const canCancel = canBuyerCancelOrder(effectiveOrder, {
    cancellationWindowHours: orderSettings?.cancellationWindowHours,
  });

  const handleReorder = useCallback(() => onReorder?.(order), [onReorder, order]);
  const handlePress = useCallback(() => onPress?.(order), [onPress, order]);
  const handleReturn = useCallback(() => {
    onReturn?.(effectiveOrder);
  }, [onReturn, effectiveOrder]);

  const handleOpenCancelDialog = useCallback(() => {
    if (!canCancel) return;
    setCancelDialogOpen(true);
  }, [canCancel]);

  const handleConfirmCancelOrder = useCallback(() => {
    cancelOrder.mutate(
      { orderId: effectiveOrder.id },
      {
        onSettled: () => {
          setCancelDialogOpen(false);
        },
      },
    );
  }, [cancelOrder, effectiveOrder.id]);

  const formattedDate = (() => {
    try {
      return format(parseISO(order.createdAt), 'dd MMM yyyy');
    } catch {
      return order.createdAt;
    }
  })();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.borderDivider,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    metaWrap: { gap: 4 },
    orderNum: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    itemCount: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    datePriceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    date: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    dot: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    total: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    thumbRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderDivider,
    },
    thumbImage: { width: '100%', height: '100%', borderRadius: Radius.sm },
    thumbText: { fontSize: Typography.fsLabel, fontWeight: Typography.fwBold, color: colors.brandNavy },
    moreText: { fontSize: Typography.fsLabel, color: colors.textSecondary, alignSelf: 'center' },
    footerActions: {
      marginHorizontal: -Spacing.md,
      marginBottom: -Spacing.md,
    },
    actionRow: {
      borderTopWidth: 1,
      borderTopColor: colors.borderDivider,
      flexDirection: 'row',
    },
    reorderBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: Radius.sm,
    },
    reorderBtnText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.statusDelivered },
    /** Cancel / Return — same column layout, divider from Reorder or previous action */
    footerActionDivider: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderLeftWidth: 1,
      borderLeftColor: colors.borderDivider,
    },
    footerActionMuted: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.statusReturned,
    },
  });

  // Order list payload is summary-only; fetch detail payload to get item images.
  const items = (order.items?.length ? order.items : orderDetail?.items) ?? [];
  const visibleItems = items.slice(0, 3);
  const totalItemCount = items.reduce((sum, item) => sum + (item.qty ?? 0), 0);
  const extraCount = items.length - 3;

  return (
    <Fragment>
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={handlePress}>
      <View style={styles.topRow}>
        <View style={styles.metaWrap}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <Text style={styles.itemCount}>
            {totalItemCount} item{totalItemCount === 1 ? '' : 's'}
          </Text>
        </View>
        <StatusChip status={order.status} />
      </View>
      <View style={styles.datePriceRow}>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.total}>₹{order.total.toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.thumbRow}>
        {visibleItems.map((item) => (
          <View key={item.id} style={styles.thumb}>
            {item.image ? (
              <FastImage
                source={{ uri: item.image, priority: FastImage.priority.normal }}
                resizeMode={FastImage.resizeMode.cover}
                style={styles.thumbImage}
              />
            ) : (
              <Text style={styles.thumbText}>{item.name.slice(0, 2).toUpperCase()}</Text>
            )}
          </View>
        ))}
        {extraCount > 0 && <Text style={styles.moreText}>+{extraCount} more</Text>}
      </View>
      <View style={styles.footerActions}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.reorderBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleReorder();
            }}
          >
            <Text style={styles.reorderBtnText}>Reorder</Text>
          </TouchableOpacity>
          {canCancel ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.footerActionDivider}
              disabled={cancelOrder.isPending}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenCancelDialog();
              }}
            >
              <Text style={[styles.footerActionMuted, cancelOrder.isPending && { opacity: 0.5 }]}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
          {returnState.show && !returnState.disabled ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.footerActionDivider}
              onPress={(e) => {
                e.stopPropagation();
                handleReturn();
              }}
            >
              <Text style={styles.footerActionMuted}>Return</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
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
    </Fragment>
  );
}
