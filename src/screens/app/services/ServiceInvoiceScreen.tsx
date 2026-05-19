import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Share2 } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { useBooking, useBookingInvoice } from '@/services/services/services.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';

type Route = RouteProp<ServicesStackParamList, 'ServiceInvoice'>;

export function ServiceInvoiceScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { bookingId } = route.params;

  const { data: booking } = useBooking(bookingId);
  const { data: invoice, isLoading } = useBookingInvoice(bookingId);

  const handleShare = useCallback(async () => {
    if (!invoice) return;
    const lines = (invoice.line_items ?? []) as Array<{ description?: string; qty?: number; amount?: number; gst_amount?: number }>;
    const body = [
      `Invoice ${invoice.invoice_number}`,
      `Booking #${bookingId}`,
      '',
      ...lines.map((l) => `${l.description ?? 'Item'} × ${l.qty ?? 1} — ₹${(Number(l.amount ?? 0) + Number(l.gst_amount ?? 0)).toLocaleString('en-IN')}`),
      '',
      `Subtotal: ₹${Number(invoice.subtotal).toLocaleString('en-IN')}`,
      `CGST: ₹${Number(invoice.cgst_amount).toLocaleString('en-IN')}`,
      `SGST: ₹${Number(invoice.sgst_amount).toLocaleString('en-IN')}`,
      `Total: ₹${Number(invoice.total_amount).toLocaleString('en-IN')}`,
    ].join('\n');
    await Share.share({ message: body });
  }, [invoice, bookingId]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, margin: Spacing.lg },
    title: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.textPrimary },
    meta: { fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: 4 },
    section: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    label: { fontSize: Typography.fsBody, color: colors.textSecondary, flex: 1 },
    sub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    value: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium },
    divider: { height: 1, backgroundColor: colors.borderDivider, marginVertical: Spacing.sm },
    totalLabel: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwSemibold },
    totalValue: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwBold },
    shareBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderRadius: Radius.md, borderWidth: 1.5, borderColor: colors.brandTeal,
      alignSelf: 'flex-start', marginTop: Spacing.lg,
    },
    shareText: { color: colors.brandTeal, fontWeight: Typography.fwSemibold, fontSize: Typography.fsBody },
  });

  if (isLoading || !invoice || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Invoice" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  const lines = (invoice.line_items ?? []) as Array<{
    description?: string;
    qty?: number;
    unit_price?: number;
    amount?: number;
    gst_rate?: number;
    gst_amount?: number;
  }>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Invoice" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.card}>
          <Text style={styles.title}>{invoice.invoice_number}</Text>
          <Text style={styles.meta}>Booking #{bookingId}</Text>
          {invoice.created_at ? (
            <Text style={styles.meta}>
              Issued: {(() => { try { return format(parseISO(invoice.created_at), 'dd MMM yyyy'); } catch { return invoice.created_at; } })()}
            </Text>
          ) : null}

          <Text style={styles.section}>Line Items</Text>
          {lines.length === 0 ? (
            <Text style={styles.sub}>No line items.</Text>
          ) : (
            lines.map((l, i) => {
              const qty = Number(l.qty ?? 1);
              const lineAmount = Number(l.amount ?? 0);
              const lineGst = Number(l.gst_amount ?? 0);
              const lineTotal = lineAmount + lineGst;
              return (
                <View key={i} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label} numberOfLines={2}>{l.description ?? 'Item'}</Text>
                    <Text style={styles.sub}>
                      Qty {qty} · @ ₹{Number(l.unit_price ?? 0).toLocaleString('en-IN')}
                      {l.gst_rate ? ` · GST ${l.gst_rate}%` : ''}
                    </Text>
                  </View>
                  <Text style={styles.value}>₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                </View>
              );
            })
          )}

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>₹{Number(invoice.subtotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CGST</Text>
            <Text style={styles.value}>₹{Number(invoice.cgst_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SGST</Text>
            <Text style={styles.value}>₹{Number(invoice.sgst_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{Number(invoice.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
          </View>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.85}>
            <Share2 size={18} color={colors.brandTeal} strokeWidth={1.5} />
            <Text style={styles.shareText}>Share Invoice</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
