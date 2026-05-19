import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Clock } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { OrdersStackParamList } from '@/navigation/types';

type Route = RouteProp<OrdersStackParamList, 'PaymentPending'>;

export function PaymentPendingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { orderNumber, orderId } = route.params ?? {};
  const displayOrderNumber = orderNumber || (orderId ? `#${orderId}` : '—');

  const handleGoHome = useCallback(() => {
    navigation.navigate('App' as never);
  }, [navigation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    iconWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.brandAmber + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xxl,
    },
    heading: { fontSize: 22, fontWeight: Typography.fwBold, color: colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
    sub: { fontSize: Typography.fsProduct, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xxl },
    orderNum: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: colors.bgCard,
      marginBottom: Spacing.xxl,
    },
    orderNumText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    orderNumValue: { fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: colors.textPrimary, textAlign: 'center', marginTop: 4 },
    btnWrap: { width: '100%', gap: Spacing.md },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Clock size={48} color={colors.brandAmber} strokeWidth={1.5} />
        </View>
        <Text style={styles.heading}>Payment Under Verification</Text>
        <Text style={styles.sub}>
          Our team is reviewing your payment proof. You'll be notified once confirmed.
        </Text>
        <View style={styles.orderNum}>
          <Text style={styles.orderNumText}>Order Number</Text>
          <Text style={styles.orderNumValue}>{displayOrderNumber}</Text>
        </View>
        <View style={styles.btnWrap}>
          <PrimaryButton label="Go to Home" onPress={handleGoHome} />
        </View>
      </View>
    </SafeAreaView>
  );
}
