import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { CheckCircle2, Clock } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { OrdersStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<OrdersStackParamList, 'OrderSuccess'>;
type Route = RouteProp<OrdersStackParamList, 'OrderSuccess'>;

// Terminal screen for a successful checkout. The user lands here after the
// backend has accepted the order. For online payments (`paymentMode: 'online'`)
// the order is in `processing`. For manual transfers the user has just
// uploaded proof and the order is `pending_payment` until admin verifies.
export function OrderSuccessScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId, orderNumber, totalAmount, paymentMode } = route.params;

  const isPendingVerification = paymentMode === 'manual';

  const handleTrackOrder = useCallback(() => {
    // Replace the success screen with the order detail so the user can't
    // back-swipe into an empty payment flow. popToTop first to clear the
    // checkout history, then navigate to OrderDetail in this stack.
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Orders' }, { name: 'OrderDetail', params: { orderId } }],
      }),
    );
  }, [navigation, orderId]);

  const handleContinueShopping = useCallback(() => {
    // Bounce out to the tab navigator's home tab. `App` is the root tab
    // navigator's name, mirrored from PaymentPendingScreen.
    navigation.navigate('App' as never);
  }, [navigation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    iconWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isPendingVerification
        ? colors.brandAmber + '20'
        : colors.statusDelivered + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xxl,
    },
    heading: {
      fontSize: 22,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    sub: {
      fontSize: Typography.fsProduct,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xxl,
      paddingHorizontal: Spacing.md,
    },
    detailsCard: {
      width: '100%',
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xxl,
      gap: Spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailLabel: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    detailValue: {
      fontSize: Typography.fsProduct,
      fontWeight: Typography.fwSemibold,
      color: colors.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderDivider,
    },
    btnWrap: { width: '100%', gap: Spacing.md },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          {isPendingVerification ? (
            <Clock size={48} color={colors.brandAmber} strokeWidth={1.5} />
          ) : (
            <CheckCircle2 size={56} color={colors.statusDelivered} strokeWidth={1.5} />
          )}
        </View>
        <Text style={styles.heading}>
          {isPendingVerification ? 'Order Placed — Verifying Payment' : 'Order Placed Successfully'}
        </Text>
        <Text style={styles.sub}>
          {isPendingVerification
            ? "Our team will confirm your transfer within 2–4 hours. You'll get a notification once verified."
            : paymentMode === 'cod'
              ? "We've received your order. Please keep the cash ready — you'll pay when it's delivered."
              : "We've received your order. You'll get updates as it moves through fulfilment."}
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Number</Text>
            <Text style={styles.detailValue}>{orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.btnWrap}>
          <PrimaryButton label="Track Order" onPress={handleTrackOrder} />
          <PrimaryButton
            label="Continue Shopping"
            variant="outlined"
            onPress={handleContinueShopping}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
