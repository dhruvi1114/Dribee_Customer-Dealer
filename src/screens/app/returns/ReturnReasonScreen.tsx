import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Minus, Plus } from 'lucide-react-native';
import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { AppDropdown } from '@/components/ui/Dropdown';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useReturnReasons } from '@/services/master/master.query';
import { useOrder } from '@/services/orders/orders.query';
import type { OrdersStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;
type Route = RouteProp<OrdersStackParamList, 'ReturnReason'>;

export function ReturnReasonScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId, itemIds } = route.params;
  // Map of orderItemId -> selected return_reason_id (master id, as string).
  const [reasonByItemId, setReasonByItemId] = useState<Record<string, string>>({});
  // Map of orderItemId -> qty to return. Defaults to full ordered qty when item loads.
  const [qtyByItemId, setQtyByItemId] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  const { data: reasons = [], isLoading: reasonsLoading } = useReturnReasons();
  const { data: order, isLoading: orderLoading } = useOrder(orderId);
  const activeReasons = useMemo(
    () => reasons.filter((r) => r.is_active ?? r.isActive ?? true),
    [reasons],
  );

  const itemsToReturn = useMemo(
    () => (order?.items ?? []).filter((it) => itemIds.includes(it.id)),
    [order, itemIds],
  );

  const reasonItems = useMemo(
    () => activeReasons.map((r) => ({ label: r.reason, value: String(r.id) })),
    [activeReasons],
  );

  const adjustQty = useCallback(
    (itemId: string, delta: number, max: number) => {
      setQtyByItemId((prev) => {
        const current = prev[itemId] ?? max;
        const next = Math.max(1, Math.min(max, current + delta));
        return { ...prev, [itemId]: next };
      });
    },
    [],
  );

  const handleContinue = useCallback(() => {
    const items = itemIds.map((id) => {
      const orderItem = itemsToReturn.find((it) => it.id === id);
      const max = orderItem?.qty ?? 1;
      return {
        id,
        returnReasonId: reasonByItemId[id]!,
        qty: qtyByItemId[id] ?? max,
      };
    });
    navigation.navigate('ReturnPhotoUpload', {
      orderId,
      items,
      notes: notes.trim() || undefined,
    });
  }, [itemIds, itemsToReturn, navigation, notes, orderId, qtyByItemId, reasonByItemId]);

  const allItemsHaveReason = itemIds.every((id) => !!reasonByItemId[id]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    intro: {
      fontSize: Typography.fsBody,
      color: colors.textSecondary,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      lineHeight: 22,
    },
    itemCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      padding: Spacing.lg,
    },
    itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    thumbText: { fontSize: 12, fontWeight: Typography.fwBold, color: colors.brandNavy },
    itemInfo: { flex: 1 },
    itemName: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    itemMeta: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    pickerLabel: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: Spacing.lg,
      marginBottom: Spacing.xs,
    },
    qtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      marginTop: Spacing.xs,
    },
    qtyBtn: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      backgroundColor: colors.bgInput,
      justifyContent: 'center',
      alignItems: 'center',
    },
    qtyBtnDisabled: { opacity: 0.4 },
    qtyValue: {
      fontSize: Typography.fsScreen,
      fontWeight: Typography.fwSemibold,
      color: colors.textPrimary,
      minWidth: 32,
      textAlign: 'center',
    },
    qtyMax: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    notesLabel: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      marginBottom: Spacing.xs,
    },
    notesInput: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      height: 100,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      padding: Spacing.md,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
    stickyBar: {
      padding: Spacing.lg,
      backgroundColor: colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: colors.borderDivider,
    },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
    emptyText: { fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center' },
  });

  if (reasonsLoading || orderLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Select Return Reason" showBack />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  if (activeReasons.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Select Return Reason" showBack />
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            No return reasons configured. Please contact support.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Select Return Reason" showBack />
      <FlatList
        data={itemsToReturn}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Text style={styles.intro}>
            Pick a reason for each item you&apos;re returning.
          </Text>
        }
        renderItem={({ item }) => {
          const maxQty = item.qty;
          const qty = qtyByItemId[item.id] ?? maxQty;
          const canDecrement = qty > 1;
          const canIncrement = qty < maxQty;
          return (
            <View style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.thumb}>
                  {item.image ? (
                    <FastImage
                      source={{ uri: item.image }}
                      style={{ width: 48, height: 48, borderRadius: Radius.sm }}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <Text style={styles.thumbText}>
                      {(item.name || '').slice(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.variant} × {item.qty} ordered</Text>
                </View>
              </View>

              {maxQty > 1 ? (
                <>
                  <Text style={styles.pickerLabel}>How many to return</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, !canDecrement && styles.qtyBtnDisabled]}
                      onPress={() => adjustQty(item.id, -1, maxQty)}
                      disabled={!canDecrement}
                      activeOpacity={0.85}
                    >
                      <Minus size={16} color={colors.textPrimary} strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}</Text>
                    <TouchableOpacity
                      style={[styles.qtyBtn, !canIncrement && styles.qtyBtnDisabled]}
                      onPress={() => adjustQty(item.id, +1, maxQty)}
                      disabled={!canIncrement}
                      activeOpacity={0.85}
                    >
                      <Plus size={16} color={colors.textPrimary} strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={styles.qtyMax}>of {maxQty}</Text>
                  </View>
                </>
              ) : null}

              <AppDropdown
                label="Return reason"
                data={reasonItems}
                value={reasonByItemId[item.id] ?? ''}
                placeholder="Select reason"
                onChange={(val) => setReasonByItemId((prev) => ({ ...prev, [item.id]: val }))}
              />
            </View>
          );
        }}
        ListFooterComponent={
          <>
            <Text style={styles.notesLabel}>Additional notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything else our team should know..."
              placeholderTextColor={colors.textTertiary}
              multiline
            />
          </>
        }
      />
      <View style={styles.stickyBar}>
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!allItemsHaveReason} />
      </View>
    </SafeAreaView>
  );
}
