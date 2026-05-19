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
import { User, Briefcase } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useRegisterDealer, useRegisterCustomer } from '@/services/auth/auth.query';
import { dealerRegisterSchema, customerRegisterSchema } from '@/utils/validations';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type RegistrationRole = 'dealer' | 'customer';

interface FieldState {
  fullName: string;
  phone: string;
  email: string;
  businessName: string;
  gstin: string;
}

export function RegisterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();

  const registerDealer = useRegisterDealer();
  const registerCustomer = useRegisterCustomer();

  const [role, setRole] = useState<RegistrationRole>('customer');
  const [fields, setFields] = useState<FieldState>({
    fullName: '',
    phone: '',
    email: '',
    businessName: '',
    gstin: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FieldState, string>>>({});

  const setField = useCallback((key: keyof FieldState, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const handleCreate = useCallback(() => {
    if (role === 'dealer') {
      const parsed = dealerRegisterSchema.safeParse({
        fullName: fields.fullName,
        phone: fields.phone,
        email: fields.email,
        businessName: fields.businessName,
        gstin: fields.gstin,
      });
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        setErrors({
          fullName: fieldErrors.fullName?.[0],
          phone: fieldErrors.phone?.[0],
          email: fieldErrors.email?.[0],
          businessName: fieldErrors.businessName?.[0],
          gstin: fieldErrors.gstin?.[0],
        });
        return;
      }
      setErrors({});
      registerDealer.mutate(
        {
          business_name: fields.businessName,
          phone: fields.phone,
          email: fields.email,
          gst_number: fields.gstin || undefined,
        },
        {
          onSuccess: () => navigation.navigate('Login'),
        },
      );
    } else {
      const parsed = customerRegisterSchema.safeParse({
        fullName: fields.fullName,
        phone: fields.phone,
        email: fields.email,
      });
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        setErrors({
          fullName: fieldErrors.fullName?.[0],
          phone: fieldErrors.phone?.[0],
          email: fieldErrors.email?.[0],
        });
        return;
      }
      setErrors({});
      registerCustomer.mutate(
        {
          name: fields.fullName,
          phone: fields.phone,
          email: fields.email,
        },
        {
          onSuccess: () => navigation.navigate('Login'),
        },
      );
    }
  }, [fields, role, registerDealer, registerCustomer, navigation]);

  const handleLogin = useCallback(() => navigation.goBack(), [navigation]);

  const isLoading = registerDealer.isPending || registerCustomer.isPending;
  const isDealer = role === 'dealer';
  const canSubmit =
    fields.fullName.length > 0 &&
    fields.phone.length === 10 &&
    (!isDealer || fields.businessName.length > 0);

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
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -20,
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    sectionTitle: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    roleRow: { flexDirection: 'row', gap: Spacing.md },
    roleCard: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      borderWidth: 2,
      alignItems: 'center',
      gap: Spacing.sm,
    },
    roleTitle: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold },
    roleSub: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
    label: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.xs,
      marginTop: Spacing.lg,
    },
    input: {
      height: 52,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
    },
    inputError: { borderColor: '#DC2626' },
    errorText: { fontSize: 12, color: '#DC2626', marginTop: Spacing.xs },
    btnWrap: { marginTop: Spacing.xxl },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    loginText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    loginLink: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Dribee</Text>
        <View>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subHeading}>Join as dealer or customer</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Type</Text>
            <View style={styles.roleRow}>
              {(['dealer', 'customer'] as RegistrationRole[]).map((r) => {
                const selected = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.85}
                    style={[
                      styles.roleCard,
                      {
                        borderColor: selected ? '#1A3353' : colors.borderCard,
                        backgroundColor: selected ? '#1A335310' : colors.bgCard,
                      },
                    ]}
                    onPress={() => setRole(r)}
                  >
                    {r === 'dealer' ? (
                      <Briefcase size={24} color={selected ? '#1A3353' : colors.textTertiary} strokeWidth={1.5} />
                    ) : (
                      <User size={24} color={selected ? '#1A3353' : colors.textTertiary} strokeWidth={1.5} />
                    )}
                    <Text style={[styles.roleTitle, { color: selected ? '#1A3353' : colors.textPrimary }]}>
                      {r === 'dealer' ? 'Dealer' : 'Customer'}
                    </Text>
                    <Text style={[styles.roleSub, { color: colors.textSecondary }]}>
                      {r === 'dealer'
                        ? 'Buy parts with tier pricing & quotations'
                        : 'Order parts & book services'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fields.fullName}
              onChangeText={(v) => setField('fullName', v)}
              placeholder="Enter full name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={fields.phone}
              onChangeText={(v) => setField('phone', v)}
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              value={fields.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="Enter email address"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {isDealer && (
              <>
                <Text style={styles.label}>Business Name</Text>
                <TextInput
                  style={styles.input}
                  value={fields.businessName}
                  onChangeText={(v) => setField('businessName', v)}
                  placeholder="Enter business name"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={styles.label}>GSTIN (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.gstin ? styles.inputError : null]}
                  value={fields.gstin}
                  onChangeText={(v) => setField('gstin', v.toUpperCase())}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                  maxLength={15}
                />
                {errors.gstin ? <Text style={styles.errorText}>{errors.gstin}</Text> : null}
              </>
            )}

            <View style={styles.btnWrap}>
              <PrimaryButton
                label="Create Account"
                onPress={handleCreate}
                disabled={!canSubmit || isLoading}
                loading={isLoading}
              />
            </View>
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.85}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
