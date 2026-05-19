import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Upload, Copy, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { logger } from '@/lib/logger';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ServicesStackParamList>;
type Route = RouteProp<ServicesStackParamList, 'ManualPaymentUpload'>;

const BANK_DETAILS = [
  { label: 'Account Name', value: 'Dribee Pvt Ltd' },
  { label: 'Account Number', value: '1234567890123456', sensitive: true },
  { label: 'IFSC Code', value: 'HDFC0001234', sensitive: true },
  { label: 'Bank', value: 'HDFC Bank' },
  { label: 'UPI ID', value: 'dribee@hdfcbank', sensitive: true },
];

export function ManualPaymentUploadScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { amount, orderId, orderNumber, bookingId } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleCopy = useCallback((value: string) => {
    logger.info('Copied to clipboard:', value);
  }, []);

  const handleSubmit = useCallback(() => {
    // Cart checkout (no bookingId) lands on the unified OrderSuccess screen
    // with payment-under-verification messaging. Service-booking payments keep
    // the legacy PaymentPending screen until that flow gets the same treatment.
    if (orderId && !bookingId) {
      navigation.navigate('OrderSuccess', {
        orderId,
        orderNumber: orderNumber ?? orderId,
        totalAmount: amount,
        paymentMode: 'manual',
      });
      return;
    }
    navigation.navigate('PaymentPending', { orderId, bookingId });
  }, [amount, bookingId, navigation, orderId, orderNumber]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    bankCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      borderLeftWidth: 3,
      borderLeftColor: '#1A3353',
      margin: Spacing.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    bankTitle: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginBottom: 4 },
    bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bankLabel: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    bankValue: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    copyBtn: { marginLeft: Spacing.sm, padding: 4 },
    uploadArea: {
      margin: Spacing.lg,
      height: 160,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      borderStyle: 'dashed',
      borderRadius: Radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      gap: Spacing.sm,
    },
    uploadText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    previewImg: {
      margin: Spacing.lg,
      height: 200,
      borderRadius: Radius.lg,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
    note: { fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', marginHorizontal: Spacing.xl, lineHeight: 22 },
    stickyBar: {
      padding: Spacing.lg,
      backgroundColor: colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: colors.borderDivider,
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Upload Payment Proof" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.bankCard}>
          <Text style={styles.bankTitle}>Bank Details — Transfer ₹{amount.toLocaleString('en-IN')}</Text>
          {BANK_DETAILS.map(({ label, value, sensitive }) => (
            <View key={label} style={styles.bankRow}>
              <Text style={styles.bankLabel}>{label}</Text>
              <Text style={styles.bankValue} numberOfLines={1}>{value}</Text>
              {sensitive && (
                <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopy(value)} activeOpacity={0.85}>
                  <Copy size={14} color={colors.brandBlue} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {imageUri ? (
          <View style={styles.previewImg}>
            <Text style={{ color: colors.textTertiary }}>Screenshot selected ✓</Text>
            <TouchableOpacity style={styles.removeBtn} onPress={() => setImageUri(null)} activeOpacity={0.85}>
              <X size={20} color={colors.statusReturned} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage} activeOpacity={0.85}>
            <Upload size={32} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.uploadText}>Tap to upload screenshot</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          Your payment will be verified within 2–4 hours. You'll receive a notification once confirmed.
        </Text>
      </ScrollView>
      <View style={styles.stickyBar}>
        <PrimaryButton label="Submit Payment Proof" onPress={handleSubmit} disabled={!imageUri} />
      </View>
    </SafeAreaView>
  );
}
