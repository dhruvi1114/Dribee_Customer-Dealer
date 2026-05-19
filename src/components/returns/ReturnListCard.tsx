import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Package, CheckCircle } from 'lucide-react-native';
import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { Return, ReturnStatus } from '@/types/return';

const STEPS = ['Requested', 'Picked Up', 'Refunded'] as const;

function formatInr(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount)}`;
  }
}

function safeFormatDate(iso: string, pattern: string): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

/** Filled segment count for 3-step strip: Requested → Picked Up → Refunded */
function stepperFilledCount(status: ReturnStatus): number {
  switch (status) {
    case 'completed':
      return 3;
    case 'received':
      return 2;
    case 'approved':
    case 'partial_approved':
      return 2;
    case 'requested':
      return 1;
    case 'rejected':
      return 0;
    default:
      return 1;
  }
}

function statusBadge(status: ReturnStatus, colors: ThemeColors) {
  if (status === 'completed') {
    return {
      label: 'Refunded',
      bg: `${colors.statusDelivered}18`,
      color: colors.statusDelivered,
    };
  }
  if (status === 'rejected') {
    return {
      label: 'Rejected',
      bg: `${colors.statusReturned}18`,
      color: colors.statusReturned,
    };
  }
  return {
    label: 'Processing',
    bg: `${colors.statusPlaced}22`,
    color: colors.statusPlaced,
  };
}

interface ReturnListCardProps {
  ret: Return;
  onPress: () => void;
}

function ReturnListCardInner({ ret, onPress }: ReturnListCardProps) {
  const { colors } = useTheme();

  const first = ret.items[0];
  const productTitle = first
    ? [first.productName, first.variantName].filter(Boolean).join(' ')
    : ret.orderNumber
      ? `Order ${ret.orderNumber}`
      : ret.orderId
        ? `Order #${ret.orderId}`
        : 'Return request';
  const qty = first?.requestedQty ?? 0;
  const sku =
    first?.skuCode?.trim() ||
    (first?.orderItemId ? String(first.orderItemId).slice(0, 14) : '') ||
    '';
  const reasonText =
    first?.reason?.trim() || ret.returnReasonLabel?.trim() || '—';
  const moreCount = ret.items.length > 1 ? ret.items.length - 1 : 0;

  const badge = statusBadge(ret.status, colors);
  const filled = stepperFilledCount(ret.status);
  const activeColor = ret.status === 'completed' ? colors.statusDelivered : colors.brandTeal;
  const requestedOn = safeFormatDate(ret.createdAt, 'dd MMM yyyy');
  const refundAmount =
    ret.totalRefund != null && Number.isFinite(ret.totalRefund) && ret.totalRefund > 0 ? ret.totalRefund : null;
  const refundLabel =
    refundAmount != null
      ? formatInr(refundAmount)
      : ret.status === 'rejected'
        ? '—'
        : 'Pending';
  const creditDateIso = ret.reviewedAt || ret.createdAt;
  const creditDateLabel = safeFormatDate(creditDateIso, 'dd MMM yyyy');

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderCard,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    returnId: {
      fontSize: Typography.fsProduct,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
      flex: 1,
    },
    badge: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      backgroundColor: badge.bg,
    },
    badgeText: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: badge.color,
    },
    requestedMeta: {
      marginTop: 4,
      fontSize: Typography.fsLabel,
      color: colors.textTertiary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderDivider,
      marginVertical: Spacing.md,
    },
    productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    productIcon: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: `${colors.brandTeal}14`,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    productThumb: { width: 44, height: 44, borderRadius: Radius.md },
    productBody: { flex: 1, minWidth: 0 },
    productName: {
      fontSize: Typography.fsProduct,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
    },
    productMeta: {
      marginTop: 4,
      fontSize: Typography.fsLabel,
      color: colors.textSecondary,
    },
    reasonRefundRow: {
      marginTop: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    reasonCol: { flex: 1, minWidth: 0 },
    refundCol: { alignItems: 'flex-end' },
    microLabel: {
      fontSize: Typography.fsLabel,
      color: colors.textTertiary,
      fontWeight: Typography.fwMedium,
      marginBottom: 2,
    },
    reasonValue: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
    },
    refundValue: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwBold,
      color: colors.brandNavy,
    },
    refundPending: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
    },
    stepperWrap: { marginTop: Spacing.lg },
    stepLabelsRow: { flexDirection: 'row', marginBottom: Spacing.xs },
    stepCell: { flex: 1, alignItems: 'center' },
    stepLabel: {
      fontSize: 10,
      fontWeight: Typography.fwMedium,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    trackRow: { flexDirection: 'row', gap: 2, paddingHorizontal: 2 },
    trackSeg: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
    trackSegFill: { flex: 1, height: '100%' },
    banner: {
      marginTop: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: `${colors.statusDelivered}18`,
    },
    bannerText: {
      flex: 1,
      fontSize: Typography.fsBody,
      color: colors.statusDelivered,
      fontWeight: Typography.fwMedium,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.headerRow}>
        <Text style={styles.returnId} numberOfLines={1}>
          {ret.returnNumber || ret.id}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      </View>
      {requestedOn ? <Text style={styles.requestedMeta}>Requested on {requestedOn}</Text> : null}

      <View style={styles.divider} />

      <View style={styles.productRow}>
        <View style={styles.productIcon}>
          {first?.image ? (
            <FastImage
              style={styles.productThumb}
              source={{ uri: first.image, priority: FastImage.priority.low }}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <Package size={22} color={colors.brandTeal} strokeWidth={1.5} />
          )}
        </View>
        <View style={styles.productBody}>
          <Text style={styles.productName} numberOfLines={2}>
            {productTitle}
          </Text>
          <Text style={styles.productMeta} numberOfLines={2}>
            {first
              ? `Qty: ${qty}${sku ? ` · SKU: ${sku}` : ''}${moreCount > 0 ? ` · +${moreCount} more` : ''}`
              : 'Open for product and quantity details'}
          </Text>
        </View>
      </View>

      <View style={styles.reasonRefundRow}>
        <View style={styles.reasonCol}>
          <Text style={styles.microLabel}>Reason</Text>
          <Text style={styles.reasonValue} numberOfLines={3}>
            {reasonText}
          </Text>
        </View>
        <View style={styles.refundCol}>
          <Text style={styles.microLabel}>Refund</Text>
          <Text style={refundAmount != null ? styles.refundValue : styles.refundPending}>{refundLabel}</Text>
        </View>
      </View>

      <View style={styles.stepperWrap}>
        <View style={styles.stepLabelsRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepCell}>
              <Text
                style={[
                  styles.stepLabel,
                  i < filled &&
                    ret.status !== 'rejected' && {
                      color: activeColor,
                      fontWeight: Typography.fwSemibold,
                    },
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.trackRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={styles.trackSeg}>
              <View
                style={[
                  styles.trackSegFill,
                  {
                    backgroundColor:
                      ret.status === 'rejected'
                        ? colors.borderCard
                        : i < filled
                          ? activeColor
                          : colors.borderCard,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {ret.status === 'completed' && refundAmount != null && refundAmount > 0 ? (
        <View style={styles.banner}>
          <CheckCircle size={18} color={colors.statusDelivered} strokeWidth={2} />
          <Text style={styles.bannerText}>
            Refund of {formatInr(refundAmount)} credited on {creditDateLabel}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export const ReturnListCard = memo(ReturnListCardInner);
