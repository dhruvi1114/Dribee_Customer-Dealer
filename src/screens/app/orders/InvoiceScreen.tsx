import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useOrder } from '@/services/orders/orders.query';
import { useAppSelector } from '@/store/hooks';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { OrdersStackParamList } from '@/navigation/types';

type Route = RouteProp<OrdersStackParamList, 'Invoice'>;

export function InvoiceScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const user = useAppSelector((s) => s.auth.user);

  const { data: order, isLoading } = useOrder(orderId);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    invoiceCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      margin: Spacing.lg,
      padding: Spacing.xl,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
    wordmark: { fontSize: 22, fontWeight: Typography.fwBold, color: '#1A3353' },
    invoiceLabel: { fontSize: Typography.fsLabel, fontWeight: Typography.fwBold, color: colors.textSecondary, letterSpacing: 2 },
    metaRow: { marginBottom: Spacing.sm },
    metaLabel: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    metaValue: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.borderDivider, marginVertical: Spacing.lg },
    tableHeader: { flexDirection: 'row', paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderDivider },
    tableHeaderText: { fontSize: Typography.fsLabel, fontWeight: Typography.fwSemibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', paddingVertical: Spacing.sm },
    tableCell: { fontSize: Typography.fsBody, color: colors.textPrimary },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    summaryLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    summaryValue: { fontSize: Typography.fsBody, color: colors.textPrimary },
    grandTotal: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.brandNavy },
    footer: { fontSize: Typography.fsLabel, color: colors.textTertiary, textAlign: 'center', marginTop: Spacing.xl },
    btnWrap: { margin: Spacing.lg },
  });

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Invoice" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  const dateText = (() => {
    try { return format(parseISO(order.createdAt), 'dd MMM yyyy'); } catch { return order.createdAt; }
  })();
  const cgst = Math.round(order.gst / 2);
  const sgst = Math.round(order.gst / 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Invoice" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.invoiceCard}>
          <View style={styles.topRow}>
            <Text style={styles.wordmark}>Dribee</Text>
            <Text style={styles.invoiceLabel}>TAX INVOICE</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice No.</Text>
            <Text style={styles.metaValue}>INV-{order.orderNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{dateText}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={[styles.metaLabel, { marginBottom: 4 }]}>Billed To</Text>
          <Text style={styles.metaValue}>{user?.name ?? 'Customer'}</Text>
          <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary }}>{order.address}</Text>
          <View style={styles.divider} />

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Item</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Total</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={2}>{item.name}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.qty}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>₹{item.total.toLocaleString('en-IN')}</Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{order.subtotal.toLocaleString('en-IN')}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.statusDelivered }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.statusDelivered }]}>−₹{order.discount.toLocaleString('en-IN')}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>CGST (6%)</Text>
            <Text style={styles.summaryValue}>₹{cgst.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SGST (6%)</Text>
            <Text style={styles.summaryValue}>₹{sgst.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: Typography.fwBold, color: colors.textPrimary }]}>Grand Total</Text>
            <Text style={styles.grandTotal}>₹{order.total.toLocaleString('en-IN')}</Text>
          </View>
          <Text style={styles.footer}>Thank you for your business!</Text>
        </View>
        <View style={styles.btnWrap}>
          <PrimaryButton label="Download PDF" onPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
