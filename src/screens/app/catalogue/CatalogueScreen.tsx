import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, SlidersHorizontal } from 'lucide-react-native';

import { WishlistHeaderIcon } from '@/components/shared/WishlistHeaderIcon';

import { useTheme } from '@/theme/ThemeContext';
import { ProductCard } from '@/components/home/ProductCard';
import { WarehouseBanner } from '@/components/location/WarehouseBanner';
import { ProductCardSkeleton } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppSelector } from '@/store/hooks';
import { useInfiniteStorefrontProducts } from '@/services/storefront/storefront.query';
import { useCategories, useBrands } from '@/services/master/master.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { CatalogueStackParamList } from '@/navigation/types';
import type { Product } from '@/types/catalogue';

type Nav = NativeStackNavigationProp<CatalogueStackParamList>;

// Fixed width prevents the last odd card from stretching full-width in a 2-column grid
const CARD_WIDTH = (Dimensions.get('window').width - Spacing.sm * 2) / 2 - 6 * 2;

export function CatalogueScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((s) => s.auth.user);
  const isDealer = user?.role === 'dealer_owner';

  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [activeBrandId, setActiveBrandId] = useState<number | undefined>(undefined);

  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteStorefrontProducts({ categoryId: activeCategoryId, brandId: activeBrandId });

  const products = data?.pages.flatMap((p) => p.data) ?? [];

  const handleProductPress = useCallback(
    (product: Product) =>
      navigation.navigate('ProductDetail', { productId: String(product.id) }),
    [navigation],
  );

  const handleSearch = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.bgHeader,
      gap: Spacing.md,
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
    },
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      minHeight: 36,
      borderRadius: Radius.pill,
      marginRight: Spacing.sm,
      alignSelf: 'flex-start',
      justifyContent: 'center',
    },
    chipText: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium },
    chipRowsWrap: {
      gap: Spacing.xs,
    },
    chipRowScroll: {
      flexGrow: 0,
    },
  });

  const categories = categoriesData ?? [];
  const brands = brandsData ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WarehouseBanner />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.searchBar} onPress={handleSearch} activeOpacity={0.85}>
          <Search size={18} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={{ color: colors.textTertiary, fontSize: Typography.fsInput }}>
            Search parts, brands...
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.85}>
          <SlidersHorizontal size={20} color={colors.textPrimary} strokeWidth={1.5} />
        </TouchableOpacity>
        <WishlistHeaderIcon />
      </View>

      <View style={styles.chipRowsWrap}>
        <ScrollView
          horizontal
          style={styles.chipRowScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.sm,
            paddingBottom: 0,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: !activeCategoryId ? colors.brandNavy : colors.bgSection }]}
            onPress={() => setActiveCategoryId(undefined)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, { color: !activeCategoryId ? '#fff' : colors.textSecondary }]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const active = activeCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, { backgroundColor: active ? colors.brandNavy : colors.bgSection }]}
                onPress={() => setActiveCategoryId(active ? undefined : cat.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          style={styles.chipRowScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingTop: 0,
            paddingBottom: Spacing.sm,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: !activeBrandId ? colors.brandAmber + '20' : 'transparent', borderWidth: 1, borderColor: !activeBrandId ? colors.brandAmber : colors.borderCard }]}
            onPress={() => setActiveBrandId(undefined)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, { color: !activeBrandId ? colors.brandAmber : colors.textSecondary, fontSize: 12 }]}>All Brands</Text>
          </TouchableOpacity>
          {brands.map((brand) => {
            const active = activeBrandId === brand.id;
            return (
              <TouchableOpacity
                key={brand.id}
                style={[styles.chip, { backgroundColor: active ? colors.brandAmber + '20' : 'transparent', borderWidth: 1, borderColor: active ? colors.brandAmber : colors.borderCard }]}
                onPress={() => setActiveBrandId(active ? undefined : brand.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, { color: active ? colors.brandAmber : colors.textSecondary, fontSize: 12 }]}>{brand.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => String(item)}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: Spacing.sm }}
          renderItem={() => <ProductCardSkeleton />}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: Spacing.sm, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (hasNextPage) void fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <ProductCard product={item} isDealer={isDealer} onPress={handleProductPress} style={{ flex: undefined, width: CARD_WIDTH }} />
          )}
          ListEmptyComponent={
            <EmptyState title="No products found" subtitle="Try adjusting your filters" />
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator style={{ margin: 16 }} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}
