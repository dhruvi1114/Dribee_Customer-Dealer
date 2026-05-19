import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AlertTriangle } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { useCancelBooking } from '@/services/services/services.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ServicesStackParamList>;
type Route = RouteProp<ServicesStackParamList, 'Cancellation'>;

const REASONS = ['Change of plans', 'Found another service provider', 'Emergency', 'Technician delay', 'Other'];

export function CancellationScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { bookingId } = route.params;

  const cancelMutation = useCancelBooking();
  const [selectedReason, setSelectedReason] = useState('');

  const handleConfirmCancel = useCallback(() => {
    if (!selectedReason) return;
    cancelMutation.mutate(
      { id: bookingId, data: { reason: selectedReason } },
      { onSuccess: () => navigation.navigate('ServiceCatalogue') },
    );
  }, [cancelMutation, bookingId, selectedReason, navigation]);

  const handleKeepBooking = useCallback(() => navigation.goBack(), [navigation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      backgroundColor: colors.brandAmber + '15',
      borderLeftWidth: 3,
      borderLeftColor: colors.brandAmber,
      borderRadius: Radius.sm,
      padding: Spacing.lg,
      margin: Spacing.lg,
      marginBottom: 0,
    },
    warningText: { flex: 1, fontSize: Typography.fsBody, color: colors.brandAmber, lineHeight: 22 },
    sectionTitle: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    reasonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 2,
      gap: Spacing.md,
    },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 10, height: 10, borderRadius: 5 },
    reasonText: { fontSize: Typography.fsProduct, color: colors.textPrimary, flex: 1 },
    actionRow: { flexDirection: 'row', gap: Spacing.md, margin: Spacing.lg },
    keepBtn: {
      flex: 1,
      height: 54,
      borderRadius: Radius.md,
      backgroundColor: colors.brandAmber,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keepBtnText: { fontSize: Typography.fsButton, fontWeight: Typography.fwSemibold, color: '#fff' },
    cancelConfirmBtn: {
      flex: 1,
      height: 54,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.statusReturned,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelConfirmText: { fontSize: Typography.fsButton, fontWeight: Typography.fwSemibold, color: colors.statusReturned },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Cancel Booking" showBack />
      <FlatList
        data={REASONS}
        keyExtractor={(item) => item}
        ListHeaderComponent={
          <>
            <View style={styles.warningCard}>
              <AlertTriangle size={20} color={colors.brandAmber} strokeWidth={1.5} />
              <Text style={styles.warningText}>Cancellation charges may apply based on timing.</Text>
            </View>
            <Text style={styles.sectionTitle}>Reason for Cancellation</Text>
          </>
        }
        renderItem={({ item }) => {
          const selected = item === selectedReason;
          return (
            <TouchableOpacity
              style={[styles.reasonCard, { borderColor: selected ? colors.statusReturned : colors.borderCard }]}
              onPress={() => setSelectedReason(item)}
              activeOpacity={0.85}
            >
              <View style={[styles.radio, { borderColor: selected ? colors.statusReturned : colors.borderInput }]}>
                {selected && <View style={[styles.radioInner, { backgroundColor: colors.statusReturned }]} />}
              </View>
              <Text style={styles.reasonText}>{item}</Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.keepBtn} onPress={handleKeepBooking} activeOpacity={0.85}>
              <Text style={styles.keepBtnText}>Keep Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelConfirmBtn, (!selectedReason || cancelMutation.isPending) && { opacity: 0.5 }]}
              onPress={handleConfirmCancel}
              disabled={!selectedReason || cancelMutation.isPending}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelConfirmText}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
