import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useVerifyOtp, useSendOtp } from '@/services/auth/auth.query';
import { useAppSelector } from '@/store/hooks';
import type { AuthStackParamList } from '@/navigation/types';

type Route = RouteProp<AuthStackParamList, 'Otp'>;
type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function OtpScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { phone } = route.params;

  const user = useAppSelector((s) => s.auth.user);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);

  const verifyOtpMutation = useVerifyOtp();
  const sendOtpMutation = useSendOtp();

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Navigate after successful login based on role
  useEffect(() => {
    if (!user) return;
    if (user.role === 'dealer_owner' && user.dealerStatus === 'pending') {
      navigation.reset({ index: 0, routes: [{ name: 'DealerPending' }] });
    }
  }, [user, navigation]);

  const handleChange = useCallback(
    (text: string, idx: number) => {
      const digit = text.replace(/\D/g, '').slice(-1);
      const next = [...otp];
      next[idx] = digit;
      setOtp(next);
      if (digit && idx < 5) {
        inputRefs.current[idx + 1]?.focus();
        setFocusedIdx(idx + 1);
      }
    },
    [otp],
  );

  const handleKeyPress = useCallback(
    (key: string, idx: number) => {
      if (key === 'Backspace' && !otp[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
        setFocusedIdx(idx - 1);
      }
    },
    [otp],
  );

  const handleVerify = useCallback(() => {
    const code = otp.join('');
    verifyOtpMutation.mutate({ phone, otp: code });
  }, [otp, phone, verifyOtpMutation]);

  const handleResend = useCallback(() => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    sendOtpMutation.mutate({ phone });
  }, [phone, sendOtpMutation]);

  const isComplete = otp.every((d) => d !== '');
  const isLoading = verifyOtpMutation.isPending;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    hero: {
      height: 180,
      backgroundColor: '#1A3353',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xl,
      justifyContent: 'space-between',
    },
    wordmark: { fontSize: 18, fontWeight: Typography.fwBold, color: '#fff' },
    heading: { fontSize: 28, fontWeight: Typography.fwBold, color: '#fff' },
    subHeading: { fontSize: Typography.fsProduct, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
    card: {
      flex: 1,
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -20,
      padding: Spacing.xl,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.xxl,
      gap: Spacing.md,
    },
    otpBox: {
      flex: 1,
      height: 64,
      borderRadius: Radius.md,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    otpInput: {
      fontSize: 24,
      fontWeight: Typography.fwBold,
      textAlign: 'center',
      width: '100%',
      height: '100%',
    },
    resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    resendTimer: { fontSize: Typography.fsBody, color: colors.textTertiary },
    resendLink: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
    btnWrap: { marginTop: Spacing.xxl },
  });

  const maskedPhone = `+91 ${phone.slice(0, 2)}••••••${phone.slice(-2)}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Dribee</Text>
        <View>
          <Text style={styles.heading}>Verify OTP</Text>
          <Text style={styles.subHeading}>{maskedPhone}</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => {
                const isFocused = focusedIdx === i;
                const isFilled = digit !== '';
                return (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      {
                        borderColor: isFocused ? colors.brandBlue : colors.borderInput,
                        backgroundColor: isFilled ? '#1A3353' : colors.bgCard,
                      },
                    ]}
                  >
                    <TextInput
                      ref={(r) => { inputRefs.current[i] = r; }}
                      style={[styles.otpInput, { color: isFilled ? '#fff' : colors.textPrimary }]}
                      value={digit}
                      onChangeText={(t) => handleChange(t, i)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                      keyboardType="numeric"
                      maxLength={1}
                      onFocus={() => setFocusedIdx(i)}
                      selectTextOnFocus
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={styles.resendTimer}>Resend in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.85}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.btnWrap}>
              <PrimaryButton
                label="Verify & Login"
                onPress={handleVerify}
                disabled={!isComplete || isLoading}
                loading={isLoading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
