import { useCallback } from 'react';
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
import { Search, Bell, CalendarPlus } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { WishlistHeaderIcon } from '@/components/shared/WishlistHeaderIcon';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryChips } from '@/components/home/CategoryChips';
import { ProductCard } from '@/components/home/ProductCard';
import { WarehouseBanner } from '@/components/location/WarehouseBanner';
import { useAppSelector } from '@/store/hooks';
import { useStorefrontProducts } from '@/services/storefront/storefront.query';
import { useServiceCatalogue } from '@/services/services/services.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { AppTabParamList } from '@/navigation/types';
import type { Product } from '@/types/catalogue';

type TabNav = BottomTabNavigationProp<AppTabParamList>;

// Show 2 full cards + 36dp peek of 3rd to signal scrollability
// Formula: (available - peek) / 2 - card margin*2
const HORIZONTAL_CARD_WIDTH = (Dimensions.get('window').width - Spacing.sm * 2 - 36) / 2 - 6 * 2;

export function HomeScreen() {
  const { colors } = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const isDealer = user?.role === 'dealer_owner';
  const serviceModuleOn = user?.serviceModuleEnabled !== false;
  const tabNav = useNavigation<TabNav>();

  const { data: productsData, isLoading: productsLoading } = useStorefrontProducts({ limit: 12 });
  const { data: services } = useServiceCatalogue({ enabled: serviceModuleOn });

  const products = productsData?.data ?? [];
  const topProducts = products.slice(0, 6);
  const newArrivals = products.slice(6, 12);

  const handleProductPress = useCallback(
    (product: Product) => {
      tabNav.navigate('CatalogueTab', {
        screen: 'ProductDetail',
        params: { productId: String(product.id) },
      });
    },
    [tabNav],
  );

  const handleSearchPress = useCallback(() => {
    tabNav.navigate('CatalogueTab', { screen: 'Search' });
  }, [tabNav]);

  const handleServicePress = useCallback(() => {
    if (!serviceModuleOn) return;
    tabNav.navigate('ServicesTab', { screen: 'ServiceCatalogue' });
  }, [tabNav, serviceModuleOn]);

  const handleBookServicePress = useCallback(
    (serviceId: string) => {
      if (!serviceModuleOn) return;
      tabNav.navigate('ServicesTab', { screen: 'BookService', params: { serviceId } });
    },
    [tabNav, serviceModuleOn],
  );

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    header: {
      backgroundColor: colors.bgHeader,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      paddingTop: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 0,
      elevation: 2,
    },
    wordmark: { fontSize: 20, fontWeight: Typography.fwBold, color: colors.brandNavy },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    bellDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.brandNavy,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { fontSize: 12, fontWeight: Typography.fwBold, color: '#fff' },
    locationBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.bgCard,
      gap: Spacing.xs,
    },
    locationLabel: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    locationValue: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.brandAmber },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    sectionTitle: { fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    seeAll: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
    serviceCard: {
      width: 168,
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginRight: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    serviceBookBtn: {
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: colors.brandAmber,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    serviceBookBtnText: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: '#fff',
    },
    serviceInitials: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    serviceInitialsText: { fontSize: 16, fontWeight: Typography.fwBold, color: colors.brandNavy, opacity: 0.6 },
    serviceName: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    serviceMeta: {
      fontSize: Typography.fsLabel,
      color: colors.textTertiary,
      marginTop: 4,
      lineHeight: 18,
    },
    servicePrice: { fontSize: Typography.fsBody, color: colors.brandNavy, fontWeight: Typography.fwBold, marginTop: 6 },
    productCardHorizontal: { flex: undefined, width: HORIZONTAL_CARD_WIDTH },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.wordmark}></Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSearchPress} activeOpacity={0.85}>
            <Search size={22} color={colors.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.iconBtn} onPress={handleCartPress} activeOpacity={0.85}>
            <ShoppingCart size={22} color={colors.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity> */}
          <WishlistHeaderIcon />
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.85}>
            <Bell size={22} color={colors.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity>
          {/* <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View> */}
        </View>
      </View>

      <WarehouseBanner />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <BannerCarousel />
        <CategoryChips />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Top Products</Text>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {productsLoading ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.brandNavy} />
          </View>
        ) : (
          <FlatList
            horizontal
            data={topProducts}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm }}
            renderItem={({ item }) => (
              <ProductCard product={item} isDealer={isDealer} onPress={handleProductPress} style={styles.productCardHorizontal} />
            )}
          />
        )}

        {newArrivals.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>New Arrivals</Text>
              <TouchableOpacity activeOpacity={0.85}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm }}>
              {newArrivals.map((item) => (
                <ProductCard key={String(item.id)} product={item} isDealer={isDealer} onPress={handleProductPress} />
              ))}
            </View>
          </>
        )}

        {serviceModuleOn && services && services.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Services</Text>
              <TouchableOpacity onPress={handleServicePress} activeOpacity={0.85}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
              {services.slice(0, 6).map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={styles.serviceCard}
                  activeOpacity={0.85}
                  onPress={handleServicePress}
                >
                  <View style={styles.serviceInitials}>
                    <Text style={styles.serviceInitialsText}>{svc.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {svc.name}
                  </Text>
                  {svc.service_type_name ? (
                    <Text style={styles.serviceMeta} numberOfLines={1}>
                      Type: {svc.service_type_name}
                    </Text>
                  ) : null}
                  {svc.machine_type ? (
                    <Text style={styles.serviceMeta} numberOfLines={1}>
                      Machine: {svc.machine_type}
                    </Text>
                  ) : null}
                  <Text style={styles.servicePrice}>₹{svc.base_fee?.toLocaleString('en-IN') ?? '—'}</Text>
                  <TouchableOpacity
                    style={styles.serviceBookBtn}
                    onPress={() => handleBookServicePress(String(svc.id))}
                    activeOpacity={0.85}
                    accessibilityLabel={`Book service: ${svc.name}`}
                  >
                    <CalendarPlus size={14} color="#fff" strokeWidth={2} />
                    <Text style={styles.serviceBookBtnText}>Book Now</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
