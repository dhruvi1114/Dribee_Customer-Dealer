import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useBooking, useApproveParts } from '@/services/services/services.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';

type Route = RouteProp<ServicesStackParamList, 'PartsApproval'>;

export function PartsApprovalScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { bookingId } = route.params;

  const { data: booking, isLoading } = useBooking(bookingId);
  const approvePartsMutation = useApproveParts();

  const parts = useMemo(() => booking?.parts ?? [], [booking]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const togglePart = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleApprove = useCallback(() => {
    if (!booking?.jobId || selectedIds.length === 0) return;
    approvePartsMutation.mutate(
      { jobId: booking.jobId, data: { approvedPartIds: selectedIds } },
      { onSuccess: () => navigation.goBack() },
    );
  }, [approvePartsMutation, booking, selectedIds, navigation]);

  const subtotal = parts
    .filter((p) => selectedIds.includes(p.id))
    .reduce((s, p) => s + p.price * p.qty, 0);
  const gst = Math.round(subtotal * 0.18);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      margin: Spacing.lg,
      marginBottom: 0,
    },
    infoText: { fontSize: Typography.fsBody, color: colors.textSecondary, lineHeight: 22 },
    partRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
      gap: Spacing.md,
    },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    checkmark: { color: '#fff', fontSize: 14, fontWeight: Typography.fwBold },
    partName: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.textPrimary, flex: 1 },
    partPrice: { fontSize: Typography.fsBody, fontWeight: Typography.fwBold, color: colors.brandNavy },
    summaryCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      margin: Spacing.lg,
      marginBottom: 0,
      gap: Spacing.sm,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    summaryValue: { fontSize: Typography.fsBody, color: colors.textPrimary },
    totalLabel: { fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: colors.textPrimary },
    totalValue: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.brandNavy },
    divider: { height: 1, backgroundColor: colors.borderDivider },
    stickyBar: { padding: Spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.borderDivider },
  });

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Approve Parts List" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Approve Parts List" showBack />
      <FlatList
        data={parts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              The service professional has identified the following parts needed for your repair.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity style={styles.partRow} onPress={() => togglePart(item.id)} activeOpacity={0.85}>
              <View style={[styles.checkbox, { borderColor: selected ? colors.brandNavy : colors.borderInput, backgroundColor: selected ? colors.brandNavy : 'transparent' }]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.partName}>{item.name} × {item.qty}</Text>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: (item.available ? colors.statusDelivered : colors.statusReturned) + '20', marginRight: Spacing.sm }}>
                <Text style={{ fontSize: 10, color: item.available ? colors.statusDelivered : colors.statusReturned, fontWeight: Typography.fwSemibold }}>{item.available ? 'Available' : 'N/A'}</Text>
              </View>
              <Text style={styles.partPrice}>₹{(item.price * item.qty).toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Parts Subtotal</Text><Text style={styles.summaryValue}>₹{subtotal.toLocaleString('en-IN')}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>GST (18%)</Text><Text style={styles.summaryValue}>₹{gst.toLocaleString('en-IN')}</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>₹{(subtotal + gst).toLocaleString('en-IN')}</Text></View>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <View style={styles.stickyBar}>
        <PrimaryButton
          label={approvePartsMutation.isPending ? '' : 'Approve Selected Parts'}
          onPress={handleApprove}
          disabled={selectedIds.length === 0 || approvePartsMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}
