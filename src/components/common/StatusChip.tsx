import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import type { OrderStatus } from '@/types/order';

interface StatusChipProps {
  status: OrderStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const { colors } = useTheme();

  const colorMap: Record<OrderStatus, string> = {
    pending_payment: colors.statusPlaced,
    payment_verified: colors.statusConfirmed,
    processing: colors.statusProcessing,
    pick_list_generated: colors.statusProcessing,
    dispatched: colors.statusDispatched,
    delivered: colors.statusDelivered,
    return_requested: colors.statusPlaced,
    returned: colors.statusReturned,
    cancelled: colors.textTertiary,
    rto_initiated: colors.statusDispatched,
    rto_received: colors.statusReturned,
  };

  const color = colorMap[status];

  const styles = StyleSheet.create({
    chip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: color + '26',
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{status}</Text>
    </View>
  );
}
