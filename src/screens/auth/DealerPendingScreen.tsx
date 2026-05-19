import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { logger } from '@/lib/logger';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

export function DealerPendingScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    const interval = setInterval(() => {
      logger.info('Checking dealer approval status...');
      // In a real app, call API to check dealerStatus
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl },
    illustrationWrap: {
      alignSelf: 'center',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#1A335318',
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
    },
    infoCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: Spacing.xxl,
      gap: Spacing.md,
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    infoValue: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.textPrimary },
    note: { fontSize: Typography.fsLabel, color: colors.textTertiary, textAlign: 'center', marginTop: Spacing.xl },
    btnWrap: { marginTop: Spacing.xl },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.illustrationWrap}>
          <Clock size={56} color="#1A3353" strokeWidth={1.5} />
        </View>
        <Text style={styles.heading}>Application Under Review</Text>
        <Text style={styles.sub}>
          Our team is reviewing your dealer application. You'll be notified once approved.
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user?.name ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business</Text>
            <Text style={styles.infoValue}>{user?.businessName ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.btnWrap}>
          <PrimaryButton
            label="Logout"
            onPress={handleLogout}
            variant="outlined"
            color="#1A3353"
          />
        </View>
        <Text style={styles.note}>This page auto-refreshes every 30 seconds</Text>
      </View>
    </SafeAreaView>
  );
}
