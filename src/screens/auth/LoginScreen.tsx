import { useCallback, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useSendOtp } from '@/services/auth/auth.query';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);

  const sendOtpMutation = useSendOtp();

  const handleSendOtp = useCallback(() => {
    if (phone.length !== 10) return;
    sendOtpMutation.mutate(
      { phone },
      { onSuccess: () => navigation.navigate('Otp', { phone }) },
    );
  }, [navigation, phone, sendOtpMutation]);

  const handleRegister = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

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
    label: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
      marginTop: Spacing.xl,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: focused ? colors.borderFocus : colors.borderInput,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    prefix: {
      fontSize: Typography.fsInput,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
    },
    divider: { width: 1, height: 20, backgroundColor: colors.borderInput },
    input: { flex: 1, fontSize: Typography.fsInput, color: colors.textPrimary },
    terms: {
      fontSize: Typography.fsLabel,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: Spacing.xl,
      lineHeight: 18,
    },
    registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    registerText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    registerLink: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Dribee</Text>
        <View>
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subHeading}>Login to continue</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <Text style={styles.prefix}>+91</Text>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
            <View style={{ marginTop: Spacing.xxl }}>
              <PrimaryButton
                label="Send OTP"
                onPress={handleSendOtp}
                disabled={phone.length !== 10 || sendOtpMutation.isPending}
                loading={sendOtpMutation.isPending}
              />
            </View>
            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister} activeOpacity={0.85}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
