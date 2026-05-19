import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { ScrollView as ScrollViewType } from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ChevronLeft, Star, Minus, Plus } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { WishlistHeartButton } from '@/components/shared/WishlistHeartButton';
import { ProductCard } from '@/components/home/ProductCard';
import { useAppSelector } from '@/store/hooks';
import { useAddCartItem } from '@/services/cart/cart.query';
import { useStorefrontProduct, useStorefrontProducts } from '@/services/storefront/storefront.query';
import { useProduct } from '@/services/catalogue/catalogue.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { CatalogueStackParamList } from '@/navigation/types';
import type { ProductVariant } from '@/types/catalogue';

type Route = RouteProp<CatalogueStackParamList, 'ProductDetail'>;

const SUGGESTED_CARD_WIDTH = (Dimensions.get('window').width - Spacing.sm * 2 - 36) / 2 - 6 * 2;

export function ProductDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { productId } = route.params;
  const user = useAppSelector((s) => s.auth.user);
  const isDealer = user?.role === 'dealer_owner';

  const { data: product, isLoading } = useStorefrontProduct(productId);
  const { data: catalogueProduct } = useProduct(productId);
  const addItem = useAddCartItem();

  const categoryId = product?.category?.id;
  const { data: suggestedData } = useStorefrontProducts(
    categoryId ? { categoryId, limit: 7 } : undefined,
  );
  const suggestedProducts = (suggestedData?.data ?? [])
    .filter((p) => String(p.id) !== String(productId))
    .slice(0, 6);

  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageScrollRef = useRef<ScrollViewType>(null);
  const screenWidth = Dimensions.get('window').width;

  const defaultVariant =
    product?.variants?.find((v) => v.isDefault) ?? product?.variants?.[0] ?? null;
  const activeVariant = selectedVariant ?? defaultVariant;
  const canOrder = useAppSelector((s) => s.location.canOrder);

  useEffect(() => {
    setActiveImageIndex(0);
    imageScrollRef.current?.scrollTo({ x: 0, animated: true });
  }, [activeVariant?.id]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleSuggestedPress = useCallback(
    (p: import('@/types/catalogue').Product) => {
      navigation.navigate('ProductDetail' as never, { productId: String(p.id) } as never);
    },
    [navigation],
  );
  const handleDecrement = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const handleIncrement = useCallback(() => setQty((q) => q + 1), []);

  const handleAddToCart = useCallback(() => {
    if (!product || !activeVariant) return;
    addItem.mutate({ variantId: activeVariant.id, qty });
  }, [addItem, product, activeVariant, qty]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imagePlaceholder: {
      height: 300,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageInitials: { fontSize: 64, fontWeight: Typography.fwBold, color: colors.brandNavy, opacity: 0.3 },
    productImage: { width: screenWidth, height: 300, backgroundColor: colors.bgSection },
    pagerDots: {
      position: 'absolute',
      bottom: Spacing.md,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    pagerDot: { width: 6, height: 6, borderRadius: 3 },
    machineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
    machineChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgSection,
    },
    machineChipText: { fontSize: Typography.fsLabel, color: colors.textSecondary },
    floatBtn: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bgCard,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    card: {
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -20,
      padding: Spacing.xl,
    },
    badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    badge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: colors.bgSection },
    badgeText: { fontSize: Typography.fsLabel, color: colors.textSecondary },
    name: { fontSize: 22, fontWeight: Typography.fwBold, color: colors.textPrimary, marginBottom: Spacing.sm },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
    price: { fontSize: 26, fontWeight: Typography.fwBold, color: colors.brandNavy },
    originalPrice: { fontSize: 14, color: colors.textTertiary, textDecorationLine: 'line-through' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
    ratingText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    divider: { height: 1, backgroundColor: colors.borderDivider, marginVertical: Spacing.lg },
    sectionLabel: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginBottom: Spacing.sm },
    variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    variantChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1.5 },
    stockBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill, marginBottom: Spacing.lg },
    stockText: { fontSize: Typography.fsLabel, fontWeight: Typography.fwSemibold },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
    qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSection, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary, minWidth: 32, textAlign: 'center' },
    slabCard: {
      borderLeftWidth: 3,
      borderLeftColor: colors.brandAmber,
      backgroundColor: colors.brandAmber + '10',
      borderRadius: Radius.sm,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    slabTitle: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.brandAmber, marginBottom: 4 },
    slabRow: { flexDirection: 'row', justifyContent: 'space-between' },
    slabText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    descText: { fontSize: Typography.fsBody, color: colors.textSecondary, lineHeight: 22 },
    specRow: {
      flexDirection: 'row',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
    },
    specKey: { flex: 1, fontSize: Typography.fsBody, color: colors.textSecondary },
    specVal: {
      flex: 1.2,
      fontSize: Typography.fsBody,
      color: colors.textPrimary,
      fontWeight: Typography.fwSemibold,
      textAlign: 'right',
    },
    stickyBar: { padding: Spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.borderDivider },
    suggestedSection: { backgroundColor: colors.bgApp, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    suggestedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    suggestedTitle: { fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    suggestedCard: { flex: undefined, width: SUGGESTED_CARD_WIDTH },
  });

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  const warehousePrice = activeVariant?.displayPrice ?? product.displayPrice ?? null;
  const fallbackDisplay = isDealer && (activeVariant?.dealerPrice ?? product.dealerPrice)
    ? (activeVariant?.dealerPrice ?? product.dealerPrice)!
    : (activeVariant?.price ?? product.basePrice);
  const displayPrice = warehousePrice ?? fallbackDisplay;
  const originalPrice = isDealer && (activeVariant?.dealerPrice ?? product.dealerPrice)
    ? (activeVariant?.price ?? product.basePrice)
    : undefined;
  const priceIsWarehouse =
    (activeVariant?.priceSource ?? product.priceSource) === 'warehouse';
  const gstRate = activeVariant?.gstRate ?? product.gstRate ?? null;
  const gstAmount = activeVariant?.gstAmount ?? product.gstAmount ?? null;
  const priceWithGst = activeVariant?.priceWithGst ?? product.priceWithGst ?? null;
  const inStock = activeVariant?.inStock ?? (activeVariant ? activeVariant.stock > 0 : product.inStock);
  const canAddToCart = canOrder && inStock;
  const initials = product.name.slice(0, 2).toUpperCase();
  const volumeSlabs = isDealer && activeVariant?.volumeSlabs;
  const catalogueVariantImages =
    catalogueProduct?.variants?.find((v) => v.id === activeVariant?.id)?.images ?? [];
  const variantImages =
    catalogueVariantImages.length > 0
      ? catalogueVariantImages
      : activeVariant?.image
        ? [activeVariant.image]
        : [];
  const displayImages =
    variantImages.length > 0
      ? [...variantImages, ...product.images.filter((u) => !variantImages.includes(u))]
      : product.images;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {displayImages.length > 0 ? (
          <View>
            <ScrollView
              ref={imageScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setActiveImageIndex(idx);
              }}
            >
              {displayImages.map((uri, i) => (
                <FastImage
                  key={`${uri}-${i}`}
                  source={{ uri }}
                  style={styles.productImage}
                  resizeMode={FastImage.resizeMode.contain}
                />
              ))}
            </ScrollView>
            {displayImages.length > 1 && (
              <View style={styles.pagerDots}>
                {displayImages.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pagerDot,
                      {
                        backgroundColor:
                          i === activeImageIndex ? colors.brandNavy : colors.borderCard,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageInitials}>{initials}</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.floatBtn, { top: Spacing.xl, left: Spacing.lg }]} onPress={handleBack} activeOpacity={0.85}>
          <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={[styles.floatBtn, { top: Spacing.xl, right: Spacing.lg, padding: 0 }]}>
          <WishlistHeartButton
            variantId={
              activeVariant?.id ?? product.defaultVariantId ?? product.variants[0]?.id ?? null
            }
            size={18}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.badgeRow}>
            {product.brand?.name && (
              <View style={styles.badge}><Text style={styles.badgeText}>{product.brand.name}</Text></View>
            )}
            {product.category?.name && (
              <View style={styles.badge}><Text style={styles.badgeText}>{product.category.name}</Text></View>
            )}
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{Number(priceWithGst ?? displayPrice).toLocaleString('en-IN')}
            </Text>
            {originalPrice != null && (
              <Text style={styles.originalPrice}>₹{Number(originalPrice).toLocaleString('en-IN')}</Text>
            )}
            {priceIsWarehouse && (
              <Text style={{ fontSize: 11, color: colors.brandNavy, fontWeight: '600' }}>Local price</Text>
            )}
          </View>
          {gstRate != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fsLabel, color: colors.textTertiary }}>
                Base ₹{Number(displayPrice).toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: Typography.fsLabel, color: colors.textTertiary }}>+</Text>
              <Text style={{ fontSize: Typography.fsLabel, color: colors.textTertiary }}>
                GST {gstRate}% (₹{Number(gstAmount).toLocaleString('en-IN')})
              </Text>
            </View>
          )}
          {product.rating != null && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} color={s <= Math.round(product.rating!) ? colors.brandAmber : colors.borderCard} fill={s <= Math.round(product.rating!) ? colors.brandAmber : 'transparent'} strokeWidth={1.5} />
              ))}
              {product.reviewCount != null && <Text style={styles.ratingText}>({product.reviewCount} reviews)</Text>}
            </View>
          )}

          {volumeSlabs && volumeSlabs.length > 0 && (
            <View style={styles.slabCard}>
              <Text style={styles.slabTitle}>Volume Pricing</Text>
              {volumeSlabs.map((slab) => (
                <View key={slab.id} style={styles.slabRow}>
                  <Text style={styles.slabText}>Buy {slab.minQty}+ units</Text>
                  <Text style={[styles.slabText, { color: colors.brandAmber, fontWeight: Typography.fwSemibold }]}>
                    {slab.discount != null ? `${slab.discount}% off` : `₹${slab.price.toLocaleString('en-IN')}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {product.variants.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Select Variant</Text>
              <View style={styles.variantRow}>
                {product.variants.map((v) => {
                  const isSelected = activeVariant?.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.variantChip, { borderColor: isSelected ? colors.brandNavy : colors.borderCard, backgroundColor: isSelected ? colors.brandNavy : 'transparent' }]}
                      onPress={() => setSelectedVariant(v)}
                      activeOpacity={0.85}
                    >
                      <Text style={{ fontSize: Typography.fsBody, color: isSelected ? '#fff' : colors.textSecondary }}>{v.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.divider} />
          <View style={[styles.stockBadge, { backgroundColor: inStock ? colors.statusDelivered + '20' : colors.statusReturned + '20' }]}>
            <Text style={[styles.stockText, { color: inStock ? colors.statusDelivered : colors.statusReturned }]}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement} activeOpacity={0.85}>
              <Minus size={16} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement} activeOpacity={0.85}>
              <Plus size={16} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {product.description && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </>
          )}

          {product.compatibleMachines && product.compatibleMachines.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Compatible Machines</Text>
              <View style={styles.machineRow}>
                {product.compatibleMachines.map((m) => (
                  <View key={m} style={styles.machineChip}>
                    <Text style={styles.machineChipText}>{m}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {(activeVariant?.sku ||
            product.uom ||
            product.hsnCode ||
            activeVariant?.name ||
            (catalogueProduct?.attributes && Object.keys(catalogueProduct.attributes).length > 0) ||
            (activeVariant?.attributes &&
              Object.keys(activeVariant.attributes).length > 0)) && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Specifications</Text>
              {product.brand?.name && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Brand</Text>
                  <Text style={styles.specVal}>{product.brand.name}</Text>
                </View>
              )}
              {product.category?.name && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Category</Text>
                  <Text style={styles.specVal}>{product.category.name}</Text>
                </View>
              )}
              {product.uom && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Unit of Measure</Text>
                  <Text style={styles.specVal}>{product.uom}</Text>
                </View>
              )}
              {product.hsnCode && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>HSN Code</Text>
                  <Text style={styles.specVal}>{product.hsnCode}</Text>
                </View>
              )}
              {catalogueProduct?.attributes &&
                Object.entries(catalogueProduct.attributes).map(([key, value]) => (
                  <View key={`prod-${key}`} style={styles.specRow}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specVal}>{String(value)}</Text>
                  </View>
                ))}
              {activeVariant?.name && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Variant</Text>
                  <Text style={styles.specVal}>{activeVariant.name}</Text>
                </View>
              )}
              {activeVariant?.sku && (
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>SKU</Text>
                  <Text style={styles.specVal}>{activeVariant.sku}</Text>
                </View>
              )}
              {activeVariant?.attributes &&
                Object.entries(activeVariant.attributes).map(([key, value]) => (
                  <View key={`var-${key}`} style={styles.specRow}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specVal}>{String(value)}</Text>
                  </View>
                ))}
            </>
          )}
        </View>

        {suggestedProducts.length > 0 && (
          <View style={styles.suggestedSection}>
            <View style={styles.suggestedHeader}>
              <Text style={styles.suggestedTitle}>Suggested Products</Text>
            </View>
            <FlatList
              horizontal
              data={suggestedProducts}
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm }}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  isDealer={isDealer}
                  onPress={handleSuggestedPress}
                  style={styles.suggestedCard}
                />
              )}
            />
          </View>
        )}
      </ScrollView>
      <View style={styles.stickyBar}>
        <PrimaryButton
          label={
            !canOrder
              ? 'Not available in your area'
              : !inStock
                ? 'Out of Stock'
                : `Add to Cart — ₹${(Number(priceWithGst ?? displayPrice) * qty).toLocaleString('en-IN')}`
          }
          onPress={handleAddToCart}
          disabled={!canAddToCart}
        />
      </View>
    </SafeAreaView>
  );
}
