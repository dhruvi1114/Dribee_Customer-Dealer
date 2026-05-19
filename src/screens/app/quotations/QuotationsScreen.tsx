import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, parseISO } from 'date-fns';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { EmptyState } from '@/components/common/EmptyState';
import { useQuotations } from '@/services/quotations/quotations.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { QuotationsStackParamList } from '@/navigation/types';
import type { Quotation, QuoteStatus } from '@/types/quotation';

type Nav = NativeStackNavigationProp<QuotationsStackParamList>;

const FILTERS = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'];

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: '#6B7280',
  sent: '#2563EB',
  accepted: '#16A34A',
  rejected: '#E11D48',
  expired: '#9CA3AF',
  converted: '#0D9488',
  closed: '#6B7280',
};

export function QuotationsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState('All');

  const { data, isLoading } = useQuotations(
    activeFilter !== 'All' ? { status: activeFilter.toLowerCase() as QuoteStatus } : undefined,
  );

  const quotations = data?.data ?? [];

  const handleView = useCallback(
    (q: Quotation) => navigation.navigate('QuotationDetail', { quotationId: q.id }),
    [navigation],
  );

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    chipsScroll: { flexGrow: 0 },
    chipsContainer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'flex-start' },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: Radius.pill,
      marginRight: Spacing.sm,
      alignSelf: 'flex-start',
    },
    chipText: { fontSize: Typography.fsBody, lineHeight: Typography.fsBody + 4, fontWeight: Typography.fwMedium },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    quoteNum: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    date: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    metaText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    statusChip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
    statusText: { fontSize: 11, fontWeight: Typography.fwSemibold, textTransform: 'uppercase', letterSpacing: 0.5 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
    total: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.brandNavy },
    viewBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: colors.brandNavy },
    viewBtnText: { fontSize: Typography.fsBody, color: colors.brandNavy, fontWeight: Typography.fwMedium },
    validityText: { fontSize: Typography.fsLabel },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Quotations" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContainer}
      >
        {FILTERS.map((f) => {
          const active = f === activeFilter;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, { backgroundColor: active ? colors.brandNavy : colors.bgSection }]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      ) : (
        <FlatList
          data={quotations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLORS[item.status] ?? '#6B7280';
            const formattedDate = (() => {
              try { return format(parseISO(item.createdAt), 'dd MMM yyyy'); } catch { return item.createdAt; }
            })();
            const expiresText = item.expiresAt ? (() => {
              try { return format(parseISO(item.expiresAt), 'dd MMM yyyy'); } catch { return item.expiresAt; }
            })() : '—';
            return (
              <View style={styles.card}>
                <View style={styles.topRow}>
                  <Text style={styles.quoteNum}>{item.quoteNumber}</Text>
                  <Text style={styles.date}>{formattedDate}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.items.length} item{item.items.length > 1 ? 's' : ''}</Text>
                  <Text style={[styles.validityText, { color: item.status === 'sent' ? colors.statusReturned : colors.textTertiary }]}>
                    Valid until {expiresText}
                  </Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
                <View style={styles.bottomRow}>
                  <Text style={styles.total}>₹{item.total.toLocaleString('en-IN')}</Text>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => handleView(item)} activeOpacity={0.85}>
                    <Text style={styles.viewBtnText}>View Quote</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<EmptyState title="No quotations found" />}
        />
      )}
    </SafeAreaView>
  );
}
