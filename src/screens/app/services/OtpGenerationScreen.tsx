import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useGenerateBookingOtp } from '@/services/services/services.query';
import type { ServicesStackParamList } from '@/navigation/types';

type Route = RouteProp<ServicesStackParamList, 'OtpGeneration'>;

const OTP_VALIDITY_SECONDS = 30 * 60;

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export function OtpGenerationScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { bookingId } = route.params;

  const generateOtpMutation = useGenerateBookingOtp();
  const [otp, setOtp] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(OTP_VALIDITY_SECONDS);

  const progress = useSharedValue(1);

  const requestOtp = useCallback(() => {
    generateOtpMutation.mutate(bookingId, {
      onSuccess: (data) => {
        setOtp(data.otp);
        setSecondsLeft(OTP_VALIDITY_SECONDS);
        progress.value = 1;
        progress.value = withTiming(0, { duration: OTP_VALIDITY_SECONDS * 1000 });
      },
    });
  }, [bookingId, generateOtpMutation, progress]);

  useEffect(() => {
    requestOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    if (!otp) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otp]);

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: colors.brandTeal,
    opacity: 0.8,
  }));

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    container: { flex: 1, padding: Spacing.xl, alignItems: 'center' },
    instruction: {
      fontSize: Typography.fsProduct,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginTop: Spacing.xl,
      marginBottom: Spacing.xxl,
    },
    otpRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    digitBox: {
      width: 72,
      height: 72,
      borderRadius: Radius.md,
      backgroundColor: '#1A3353',
      justifyContent: 'center',
      alignItems: 'center',
    },
    digitText: { fontSize: 32, fontWeight: Typography.fwBold, color: '#fff' },
    timerRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    timerText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    noteCard: {
      backgroundColor: colors.brandAmber + '15',
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.xl,
    },
    noteText: { fontSize: Typography.fsBody, color: colors.brandAmber, lineHeight: 22 },
    refreshBtn: { marginTop: Spacing.xl },
    refreshText: { fontSize: Typography.fsBody, color: colors.brandNavy, fontWeight: Typography.fwMedium },
  });

  const displayDigits = (otp || '----').split('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Job Verification OTP" showBack />
      <View style={styles.container}>
        <Text style={styles.instruction}>
          Share this OTP with the service professional when they arrive to start the job.
        </Text>
        <View style={styles.otpRow}>
          {displayDigits.map((d, i) => (
            <View key={i} style={styles.digitBox}>
              <Text style={styles.digitText}>{d}</Text>
            </View>
          ))}
        </View>
        <Animated.View style={[styles.timerRing, ringStyle]}>
          {generateOtpMutation.isPending && !otp ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.timerText}>{formatTimer(secondsLeft)}</Text>
          )}
        </Animated.View>
        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.85}
          onPress={requestOtp}
          disabled={generateOtpMutation.isPending}
        >
          <Text style={styles.refreshText}>
            {generateOtpMutation.isPending ? 'Generating…' : 'Generate New OTP'}
          </Text>
        </TouchableOpacity>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Do not share this OTP until the Pro arrives at your location.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
