import { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Minus, Plus, ShoppingCart } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useAppSelector } from '@/store/hooks';
import { WishlistHeartButton } from '@/components/shared/WishlistHeartButton';
import { useCart, useAddCartItem, useUpdateCartItem, useRemoveCartItem } from '@/services/cart/cart.query';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import type { Product } from '@/types/catalogue';

interface ProductCardProps {
  product: Product;
  isDealer?: boolean;
  onPress?: (product: Product) => void;
  style?: ViewStyle;
}

export function ProductCard({
  product,
  isDealer = false,
  onPress,
  style,
}: ProductCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const canOrder = useAppSelector((s) => s.location.canOrder);

  const { data: cart } = useCart();
  const addItem = useAddCartItem();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const variantId = product.defaultVariantId ?? product.variants[0]?.id ?? null;
  const cartItem = cart?.items.find((i) => i.variantId === variantId) ?? null;
  const cartQty = cartItem?.qty ?? 0;

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onPress?.(product);
  }, [onPress, product, scale]);

  const handleAdd = useCallback(() => {
    if (!variantId) return;
    addItem.mutate({ variantId, qty: 1 });
  }, [addItem, variantId]);

  const handleIncrement = useCallback(() => {
    if (!variantId) return;
    updateItem.mutate({ variantId, qty: cartQty + 1 });
  }, [updateItem, variantId, cartQty]);

  const handleDecrement = useCallback(() => {
    if (!variantId) return;
    if (cartQty <= 1) {
      removeItem.mutate(variantId);
    } else {
      updateItem.mutate({ variantId, qty: cartQty - 1 });
    }
  }, [removeItem, updateItem, variantId, cartQty]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const warehousePrice = product.displayPrice ?? null;
  const fallbackPrice = isDealer && product.dealerPrice ? product.dealerPrice : product.basePrice;
  const resolvedPrice = warehousePrice ?? fallbackPrice ?? null;
  const hasPrice = resolvedPrice != null && resolvedPrice > 0;
  const displayPrice = hasPrice ? resolvedPrice! : 0;
  const originalPrice = isDealer && product.dealerPrice ? product.basePrice : undefined;
  const priceWithGst = product.priceWithGst ?? null;
  const gstRate = product.gstRate ?? null;
  const priceIsWarehouse = product.priceSource === 'warehouse';
  const productInStock = product.inStock;
  const canAddToCart = canOrder && productInStock && hasPrice;
  const initials = product.name.slice(0, 2).toUpperCase();
  const cardImageUri =
    resolveMediaUrl(product.defaultVariantImage) ??
    resolveMediaUrl(product.images?.[0]) ??
    null;
  const firstVariantSlabs = product.variants?.[0]?.volumeSlabs;
  const nextSlab = isDealer && firstVariantSlabs?.[0];

  const styles = StyleSheet.create({
    card: {
      flex: 1,
      margin: 6,
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    imagePlaceholder: {
      height: 140,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      height: 140,
      width: '100%',
      backgroundColor: colors.bgSection,
    },
    initials: {
      fontSize: 28,
      fontWeight: Typography.fwBold,
      color: colors.brandNavy,
      opacity: 0.4,
    },
    wishlistSlot: { position: 'absolute', top: 8, right: 8 },
    info: { padding: Spacing.md },
    name: {
      fontSize: Typography.fsProduct,
      fontWeight: Typography.fwMedium,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    brand: { fontSize: Typography.fsLabel, color: colors.textTertiary, marginBottom: Spacing.xs },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    price: { fontSize: Typography.fsPrice, fontWeight: Typography.fwBold, color: colors.brandNavy },
    originalPrice: {
      fontSize: Typography.fsPriceSm,
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    slabPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      backgroundColor: colors.brandAmber + '20',
      marginBottom: Spacing.sm,
    },
    slabText: { fontSize: Typography.fsLabel, color: colors.brandAmber, fontWeight: Typography.fwMedium },
    addBtn: {
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: colors.brandAmber,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    addBtnDisabled: { backgroundColor: colors.bgSection },
    addBtnText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' },
    addBtnTextDisabled: { color: colors.textTertiary },
    pricePill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      backgroundColor: colors.brandNavy + '15',
    },
    pricePillText: {
      fontSize: 10,
      color: colors.brandNavy,
      fontWeight: Typography.fwMedium,
    },
    stepper: {
      height: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: Radius.sm,
      backgroundColor: colors.brandAmber,
      paddingHorizontal: Spacing.sm,
    },
    stepperBtn: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepperQty: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwBold,
      color: '#fff',
      minWidth: 24,
      textAlign: 'center',
    },
  });

  return (
    <Animated.View style={[styles.card, animStyle, style]}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress}>
        {cardImageUri ? (
          <FastImage
            style={styles.image}
            source={{ uri: cardImageUri, priority: FastImage.priority.normal }}
            resizeMode={FastImage.resizeMode.contain}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <View style={styles.wishlistSlot}>
          <WishlistHeartButton
            variantId={product.defaultVariantId ?? product.variants[0]?.id ?? null}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          {product.brand?.name ? <Text style={styles.brand}>{product.brand.name}</Text> : null}
          <View style={styles.priceRow}>
            {hasPrice ? (
              <>
                <Text style={styles.price}>
                  ₹{Number(priceWithGst ?? displayPrice).toLocaleString('en-IN')}
                </Text>
                {originalPrice ? (
                  <Text style={styles.originalPrice}>
                    ₹{Number(originalPrice).toLocaleString('en-IN')}
                  </Text>
                ) : null}
                {priceIsWarehouse ? (
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>Local</Text>
                  </View>
                ) : null}
                {gstRate != null ? (
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>GST {gstRate}%</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={[styles.price, { fontSize: 13, color: colors.textTertiary, fontWeight: '500' }]}>
                Price on request
              </Text>
            )}
          </View>
          {nextSlab ? (
            <View style={styles.slabPill}>
              <Text style={styles.slabText}>
                Add {nextSlab.minQty} more for {nextSlab.discount ?? 0}% off
              </Text>
            </View>
          ) : null}
          {cartQty > 0 ? (
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={handleDecrement} activeOpacity={0.7}>
                <Minus size={14} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{cartQty}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={handleIncrement} activeOpacity={0.7}>
                <Plus size={14} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.addBtn, !canAddToCart && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!canAddToCart}
            >
              {canAddToCart ? (
                <>
                  <ShoppingCart size={13} color="#fff" strokeWidth={1.5} />
                  <Text style={styles.addBtnText}>Add</Text>
                </>
              ) : !canOrder ? (
                <Text style={styles.addBtnTextDisabled}>No delivery</Text>
              ) : !hasPrice ? (
                <Text style={styles.addBtnTextDisabled}>Price on request</Text>
              ) : (
                <Text style={styles.addBtnTextDisabled}>Out of stock</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
