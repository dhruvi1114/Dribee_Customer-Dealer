import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Download } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useQuotation, useAcceptQuote, useRejectQuote } from '@/services/quotations/quotations.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { QuotationsStackParamList } from '@/navigation/types';

type Route = RouteProp<QuotationsStackParamList, 'QuotationDetail'>;

const STATUS_BG: Record<string, string> = {
  sent: '#2563EB',
  accepted: '#16A34A',
  rejected: '#E11D48',
  expired: '#9CA3AF',
  converted: '#0D9488',
  draft: '#6B7280',
  closed: '#6B7280',
};

export function QuotationDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { quotationId } = route.params;

  const { data: quote, isLoading } = useQuotation(quotationId);
  const acceptMutation = useAcceptQuote();
  const rejectMutation = useRejectQuote();

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = useCallback(() => {
    acceptMutation.mutate(quotationId);
  }, [acceptMutation, quotationId]);

  const handleRejectConfirm = useCallback(() => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate({ id: quotationId, data: { reason: rejectReason } });
    setShowRejectInput(false);
  }, [rejectMutation, quotationId, rejectReason]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    banner: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    bannerText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      margin: Spacing.lg,
      marginBottom: 0,
    },
    cardTitle: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginBottom: Spacing.md },
    tableHeader: { flexDirection: 'row', paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderDivider },
    headerText: { fontSize: Typography.fsLabel, fontWeight: Typography.fwSemibold, color: colors.textSecondary, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: Spacing.sm },
    cellText: { fontSize: Typography.fsBody, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.borderDivider, marginVertical: Spacing.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    summaryLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    summaryValue: { fontSize: Typography.fsBody, color: colors.textPrimary },
    totalLabel: { fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: colors.textPrimary },
    totalValue: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.brandNavy },
    actionRow: { flexDirection: 'row', gap: Spacing.md, margin: Spacing.lg },
    rejectBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.statusReturned,
      alignItems: 'center',
    },
    rejectText: { fontSize: Typography.fsBody, color: colors.statusReturned, fontWeight: Typography.fwMedium },
    rejectInput: {
      height: 52,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    downloadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.brandBlue,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    downloadText: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
  });

  if (isLoading || !quote) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Quotation" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  const expiresText = quote.expiresAt ? (() => {
    try { return format(parseISO(quote.expiresAt), 'dd MMM yyyy'); } catch { return quote.expiresAt; }
  })() : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={quote.quoteNumber} showBack />
      <View style={[styles.banner, { backgroundColor: STATUS_BG[quote.status] ?? colors.textTertiary }]}>
        <Text style={styles.bannerText}>Status: {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 3 }]}>Item</Text>
            <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.headerText, { flex: 2, textAlign: 'right' }]}>Total</Text>
          </View>
          {quote.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cellText, { flex: 3 }]} numberOfLines={2}>{item.productName}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{item.qty}</Text>
              <Text style={[styles.cellText, { flex: 2, textAlign: 'right' }]}>₹{item.total.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { marginTop: Spacing.md }]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{quote.subtotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryValue}>₹{quote.gst.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{quote.total.toLocaleString('en-IN')}</Text>
          </View>
          <Text style={{ fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: Spacing.sm }}>
            Valid until {expiresText}
          </Text>
        </View>

        {quote.status === 'sent' && (
          <>
            {showRejectInput ? (
              <>
                <TextInput
                  style={styles.rejectInput}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Reason for rejection..."
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => setShowRejectInput(false)} activeOpacity={0.85}>
                    <Text style={styles.rejectText}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 2 }}>
                    <PrimaryButton
                      label={rejectMutation.isPending ? '' : 'Confirm Reject'}
                      onPress={handleRejectConfirm}
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.actionRow}>
                <View style={{ flex: 2 }}>
                  <PrimaryButton
                    label={acceptMutation.isPending ? '' : 'Accept Quote'}
                    onPress={handleAccept}
                    disabled={acceptMutation.isPending}
                  />
                </View>
                <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => setShowRejectInput(true)} activeOpacity={0.85}>
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.85}>
          <Download size={16} color={colors.brandBlue} strokeWidth={1.5} />
          <Text style={styles.downloadText}>Download PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
