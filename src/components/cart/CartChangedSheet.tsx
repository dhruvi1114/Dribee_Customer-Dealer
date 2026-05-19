import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { ArrowLeft, PackageX, Tag, TrendingDown, TrendingUp } from 'lucide-react-native';

import { LightColors } from '@/constants/colors';
import type {
  CartAddressDroppedItem,
  CartAddressPriceChange,
  CartAddressSwitchResult,
} from '@/types/cart';

export interface CartChangedSheetHandle {
  present: (args: {
    result: CartAddressSwitchResult;
    previousAddressId?: number | null;
  }) => void;
  dismiss: () => void;
}

interface Props {
  onHandleReady?: (handle: CartChangedSheetHandle) => void;
  // Called when the user taps "Switch back" — receives the address id captured
  // at present-time. The sheet itself does not perform the revert; callers
  // re-issue the address mutation so they can decide which side-effects to fire
  // (e.g. updating the location slice).
  onSwitchBack?: (previousAddressId: number) => void;
}

const formatRupee = (n: number | null | undefined): string => {
  if (n == null) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const dropReasonLabel = (reason: CartAddressDroppedItem['reason']): string =>
  reason === 'no_stock' ? 'Out of stock' : 'Not available';

// Surfaced after PUT /cart/address resolves with material changes
// (dropped items, price changes, or coupon removal). Blocking by design — the
// user must acknowledge with Continue or revert with Switch back.
export function CartChangedSheet({ onHandleReady, onSwitchBack }: Props) {
  const ref = useRef<BottomSheetModal>(null);
  const [result, setResult] = useState<CartAddressSwitchResult | null>(null);
  const [previousAddressId, setPreviousAddressId] = useState<number | null>(null);

  const snapPoints = useMemo(() => ['75%'], []);

  const handle = useMemo<CartChangedSheetHandle>(
    () => ({
      present: ({ result: r, previousAddressId: prev }) => {
        setResult(r);
        setPreviousAddressId(prev ?? null);
        ref.current?.present();
      },
      dismiss: () => ref.current?.dismiss(),
    }),
    [],
  );

  if (onHandleReady) onHandleReady(handle);

  const handleSwitchBack = useCallback(() => {
    if (previousAddressId == null) return;
    onSwitchBack?.(previousAddressId);
    ref.current?.dismiss();
  }, [onSwitchBack, previousAddressId]);

  const handleContinue = useCallback(() => {
    ref.current?.dismiss();
  }, []);

  const diff = result?.diff ?? null;
  const hasDropped = (diff?.droppedItems.length ?? 0) > 0;
  const hasPriceChanges = (diff?.priceChanges.length ?? 0) > 0;
  const hasCouponRemoval = diff?.removedCoupon != null;
  const subtotalDelta =
    diff != null ? diff.newSubtotal - diff.previousSubtotal : 0;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableDismissOnClose
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Your cart was updated</Text>
        <Text style={styles.subtitle}>
          Some items changed because of your new delivery address.
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {hasDropped ? (
            <Section
              icon={<PackageX size={18} color="#DC2626" strokeWidth={1.5} />}
              title={`${diff?.droppedItems.length} item${
                diff?.droppedItems.length === 1 ? '' : 's'
              } removed`}
            >
              {diff?.droppedItems.map((d) => (
                <Row
                  key={d.variantId}
                  primary={d.displayName}
                  secondary={dropReasonLabel(d.reason)}
                  secondaryColor="#DC2626"
                />
              ))}
            </Section>
          ) : null}

          {hasPriceChanges ? (
            <Section
              icon={<TrendingDown size={18} color={LightColors.brandAmber} strokeWidth={1.5} />}
              title={`${diff?.priceChanges.length} price${
                diff?.priceChanges.length === 1 ? '' : 's'
              } changed`}
            >
              {diff?.priceChanges.map((p) => (
                <PriceChangeRow key={p.variantId} change={p} />
              ))}
            </Section>
          ) : null}

          {hasCouponRemoval ? (
            <Section
              icon={<Tag size={18} color={LightColors.textSecondary} strokeWidth={1.5} />}
              title="Coupon removed"
            >
              <Row
                primary={diff?.removedCoupon ?? ''}
                secondary="No longer valid for this address"
                secondaryColor={LightColors.textTertiary}
              />
            </Section>
          ) : null}

          {diff != null ? (
            <View style={styles.subtotalCard}>
              <Text style={styles.subtotalLabel}>New subtotal</Text>
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalNew}>{formatRupee(diff.newSubtotal)}</Text>
                {diff.previousSubtotal !== diff.newSubtotal ? (
                  <Text style={styles.subtotalOld}>was {formatRupee(diff.previousSubtotal)}</Text>
                ) : null}
              </View>
              {subtotalDelta !== 0 ? (
                <View style={styles.subtotalDeltaRow}>
                  {subtotalDelta < 0 ? (
                    <TrendingDown size={14} color="#16A34A" strokeWidth={1.5} />
                  ) : (
                    <TrendingUp size={14} color="#DC2626" strokeWidth={1.5} />
                  )}
                  <Text
                    style={[
                      styles.subtotalDelta,
                      { color: subtotalDelta < 0 ? '#16A34A' : '#DC2626' },
                    ]}
                  >
                    {subtotalDelta < 0 ? '-' : '+'}
                    {formatRupee(Math.abs(subtotalDelta))}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          {previousAddressId != null ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={handleSwitchBack}
              activeOpacity={0.85}
            >
              <ArrowLeft size={16} color={LightColors.brandNavy} strokeWidth={1.5} />
              <Text style={styles.btnSecondaryText}>Switch back</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

interface RowProps {
  primary: string;
  secondary?: string;
  secondaryColor?: string;
}

function Row({ primary, secondary, secondaryColor }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowPrimary} numberOfLines={2}>
        {primary}
      </Text>
      {secondary ? (
        <Text style={[styles.rowSecondary, secondaryColor ? { color: secondaryColor } : null]}>
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}

function PriceChangeRow({ change }: { change: CartAddressPriceChange }) {
  const went =
    change.oldUnitPrice != null && change.newUnitPrice != null
      ? change.newUnitPrice < change.oldUnitPrice
        ? 'down'
        : change.newUnitPrice > change.oldUnitPrice
          ? 'up'
          : 'same'
      : 'same';
  const color = went === 'down' ? '#16A34A' : went === 'up' ? '#DC2626' : LightColors.textSecondary;
  return (
    <View style={styles.row}>
      <Text style={styles.rowPrimary} numberOfLines={2}>
        {change.displayName}
      </Text>
      <Text style={[styles.rowSecondary, { color }]}>
        {formatRupee(change.oldUnitPrice)} {'→'} {formatRupee(change.newUnitPrice)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: LightColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: LightColors.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: 14, paddingBottom: 8 },
  section: {
    borderRadius: 12,
    backgroundColor: LightColors.bgSection,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: LightColors.textPrimary,
  },
  sectionBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowPrimary: {
    flex: 1,
    fontSize: 13,
    color: LightColors.textPrimary,
  },
  rowSecondary: {
    fontSize: 12,
    color: LightColors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  subtotalCard: {
    borderRadius: 12,
    backgroundColor: LightColors.bgCard2,
    borderWidth: 1,
    borderColor: LightColors.borderDivider,
    padding: 14,
    gap: 4,
  },
  subtotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LightColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  subtotalNew: {
    fontSize: 20,
    fontWeight: '700',
    color: LightColors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  subtotalOld: {
    fontSize: 12,
    color: LightColors.textTertiary,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  subtotalDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subtotalDelta: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 10,
  },
  btnPrimary: { backgroundColor: LightColors.brandAmber },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: {
    backgroundColor: LightColors.bgSection,
    borderWidth: 1,
    borderColor: LightColors.borderCard,
  },
  btnSecondaryText: { color: LightColors.brandNavy, fontSize: 15, fontWeight: '600' },
});
