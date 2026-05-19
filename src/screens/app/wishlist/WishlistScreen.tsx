import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { ChevronLeft, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';

import { useTheme } from '@/theme/ThemeContext';
import { Spacing, Radius } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useClearWishlist,
  useRemoveWishlistItem,
  useWishlist,
} from '@/services/wishlist/wishlist.query';
import { useAddCartItem } from '@/services/cart/cart.query';
import type { WishlistItem } from '@/types/wishlist';

export function WishlistScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<{ goBack: () => void }>();
  const { data, isLoading, refetch, isRefetching } = useWishlist();
  const clearMutation = useClearWishlist();
  const removeMutation = useRemoveWishlistItem();
  const addToCartMutation = useAddCartItem();

  const items = data?.items ?? [];

  const handleClearAll = useCallback(() => {
    if (items.length === 0) return;
    Alert.alert('Clear wishlist?', 'This will remove all items from your wishlist.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearMutation.mutate() },
    ]);
  }, [items.length, clearMutation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderDivider,
    },
    headerTitle: {
      fontSize: Typography.fsSection,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
    },
    backBtn: { padding: 4 },
    clearText: {
      fontSize: Typography.fsBody,
      color: '#EF4444',
      fontWeight: Typography.fwMedium,
    },
    row: {
      flexDirection: 'row',
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.xs,
      gap: Spacing.md,
    },
    imageWrap: { width: 80, height: 80, borderRadius: Radius.md, overflow: 'hidden' },
    image: { width: 80, height: 80 },
    imagePlaceholder: {
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initials: { fontSize: 22, fontWeight: Typography.fwBold, color: colors.brandNavy, opacity: 0.4 },
    info: { flex: 1, justifyContent: 'space-between' },
    productName: {
      fontSize: Typography.fsProduct,
      fontWeight: Typography.fwMedium,
      color: colors.textPrimary,
    },
    variant: { fontSize: Typography.fsLabel, color: colors.textSecondary, marginTop: 2 },
    added: { fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: 2 },
    addBtn: {
      marginTop: Spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      backgroundColor: colors.brandAmber,
    },
    addBtnText: { color: '#fff', fontWeight: Typography.fwSemibold, fontSize: Typography.fsBody },
    removeBtn: { padding: 4 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => (
      <View style={styles.row}>
        <View style={styles.imageWrap}>
          {item.images[0] ? (
            <FastImage
              source={{ uri: item.images[0] }}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.initials}>
                {(item.productName || '??').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.variant} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={styles.added}>
            Added {formatDistanceToNow(new Date(item.addedAt), { addSuffix: true })}
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.85}
            onPress={() => addToCartMutation.mutate({ variantId: item.variantId, qty: 1 })}
            disabled={addToCartMutation.isPending}
          >
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          activeOpacity={0.7}
          onPress={() => removeMutation.mutate(item.variantId)}
          hitSlop={8}
        >
          <X size={18} color={colors.textTertiary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    ),
    [addToCartMutation, removeMutation, colors, styles],
  );

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <TouchableOpacity onPress={handleClearAll} disabled={items.length === 0} hitSlop={8}>
          <Text style={[styles.clearText, items.length === 0 && { opacity: 0.4 }]}>Clear all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.variantId)}
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? { flex: 1 } : { paddingVertical: Spacing.sm }}
        ListEmptyComponent={
          <EmptyState
            title="No items in your wishlist yet"
            message="Tap the heart on a product to save it for later."
          />
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      />
    </SafeAreaView>
  );
}
