import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { EmptyState } from '@/components/common/EmptyState';
import { useBookings } from '@/services/services/services.query';
import { useAppSelector } from '@/store/hooks';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';
import type { Booking, BookingStatus } from '@/types/service';

type Nav = NativeStackNavigationProp<ServicesStackParamList>;

const STATUS_FILTERS = ['All', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending_assignment: '#F59E0B',
  assigned: '#2563EB',
  confirmed: '#2563EB',
  enroute: '#7C3AED',
  in_progress: '#7C3AED',
  awaiting_parts: '#EA580C',
  parts_ready: '#0EA5E9',
  parts_pending: '#EA580C',
  ready_to_resume: '#0EA5E9',
  completed: '#16A34A',
  cancelled: '#6B7280',
};

const FILTER_STATUS_MAP: Record<string, BookingStatus | undefined> = {
  Pending: 'pending_assignment',
  Assigned: 'assigned',
  'In Progress': 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

export function MyBookingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState('All');
  const user = useAppSelector((state) => state.auth.user);
  const isDealer = user?.role === 'dealer_owner';

  const { data, isLoading, refetch, isRefetching } = useBookings(
    {
      ...(activeFilter !== 'All' ? { status: FILTER_STATUS_MAP[activeFilter] } : {}),
    },
    { enabled: !!user?.id },
  );

  const bookings = data?.data ?? [];

  const handleViewDetail = useCallback(
    (booking: Booking) => navigation.navigate('BookingDetail', { bookingId: booking.id }),
    [navigation],
  );

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radius.pill, marginRight: Spacing.sm },
    chipText: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, lineHeight: 18 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
    serviceName: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: colors.textPrimary, flex: 1, marginRight: Spacing.sm },
    statusChip: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
    statusText: { fontSize: 11, fontWeight: Typography.fwSemibold, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    detailLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    detailValue: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium },
    divider: { height: 1, backgroundColor: colors.borderDivider, marginVertical: Spacing.sm },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    amountValue: { fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: colors.brandNavy },
    proRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
    proAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSection, justifyContent: 'center', alignItems: 'center' },
    proAvatarText: { fontSize: 11, fontWeight: Typography.fwBold, color: colors.brandNavy },
    proName: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium },
  });


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="My Bookings" showBack />
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.borderDivider }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}
        >
          {STATUS_FILTERS.map((f) => {
            const active = f === activeFilter;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.brandNavy : colors.bgSection,
                    borderWidth: active ? 0 : 1,
                    borderColor: colors.borderCard,
                  },
                ]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] ?? '#6B7280';
            const fee = item.serviceFee ?? 0;
            const rate = item.gstRate ?? 18;
            const gst = Math.round(fee * rate / 100);
            return (
              <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => handleViewDetail(item)}>
                <View style={styles.topRow}>
                  <Text style={styles.serviceName} numberOfLines={1}>{item.serviceName}</Text>
                  <View style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{item.status.replace(/_/g, ' ')}</Text>
                  </View>
                </View>

                {item.serviceTypeName ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service Type</Text>
                    <Text style={styles.detailValue}>{item.serviceTypeName}</Text>
                  </View>
                ) : null}
                {item.machineType ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Machine Type</Text>
                    <Text style={styles.detailValue}>{item.machineType}</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Priority</Text>
                  <Text style={[styles.detailValue, item.priority === 'urgent' && { color: colors.brandAmber }]}>
                    {item.priority === 'urgent' ? 'Urgent' : 'Normal'}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={[styles.amountRow, { marginTop: 4 }]}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.amountValue}>₹{(fee + gst).toLocaleString('en-IN')}</Text>
                </View>

                {item.pro && (
                  <View style={styles.proRow}>
                    <View style={styles.proAvatar}>
                      <Text style={styles.proAvatarText}>{item.pro.name.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.proName}>{item.pro.name}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<EmptyState title="No bookings found" subtitle="Book a service to get started" />}
        />
      )}
    </SafeAreaView>
  );
}
