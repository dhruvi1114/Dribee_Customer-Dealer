import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Search, X } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { EmptyState } from '@/components/common/EmptyState';
import { useStorefrontProducts } from '@/services/storefront/storefront.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { CatalogueStackParamList } from '@/navigation/types';
import type { Product } from '@/types/catalogue';

type Nav = NativeStackNavigationProp<CatalogueStackParamList>;

const RECENT_SEARCHES = ['Bosch oil filter', 'Exide battery', 'NGK spark plug', 'Brembo brake pad'];

export function SearchScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState(RECENT_SEARCHES);

  const { data, isLoading } = useStorefrontProducts(
    query.trim().length >= 2 ? { search: query.trim() } : undefined,
  );

  const results = query.trim().length >= 2 ? (data?.data ?? []) : [];

  const handleProductPress = useCallback(
    (product: Product) => navigation.navigate('ProductDetail', { productId: String(product.id) }),
    [navigation],
  );

  const handleRemoveRecent = useCallback(
    (r: string) => setRecents((prev) => prev.filter((x) => x !== r)),
    [],
  );

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
      backgroundColor: colors.bgHeader,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.borderFocus,
    },
    input: { flex: 1, fontSize: Typography.fsInput, color: colors.textPrimary },
    sectionLabel: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.sm,
    },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
    },
    recentText: { fontSize: Typography.fsBody, color: colors.textPrimary },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
      gap: Spacing.md,
    },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbText: { fontSize: Typography.fsLabel, fontWeight: Typography.fwBold, color: colors.brandNavy },
    resultName: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.textPrimary },
    resultBrand: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    resultPrice: { fontSize: Typography.fsBody, fontWeight: Typography.fwBold, color: colors.brandNavy },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.brandBlue} strokeWidth={1.5} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search parts, brands..."
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.85}>
              <X size={16} color={colors.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.trim() === '' ? (
        <>
          <Text style={styles.sectionLabel}>Recent Searches</Text>
          <FlatList
            data={recents}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.recentRow}>
                <Text style={styles.recentText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveRecent(item)} activeOpacity={0.85}>
                  <X size={16} color={colors.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<EmptyState title="No recent searches" />}
          />
        </>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultRow} onPress={() => handleProductPress(item)} activeOpacity={0.85}>
              <View style={styles.thumb}>
                <Text style={styles.thumbText}>{item.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.resultBrand}>{item.brand.name}</Text>
              </View>
              <Text style={styles.resultPrice}>₹{item.basePrice.toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState title={`No results for "${query}"`} subtitle="Try searching with different keywords" />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}
