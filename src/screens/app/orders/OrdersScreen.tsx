import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { OrderCard } from '@/components/orders/OrderCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useReorderFromOrder } from '@/services/cart/cart.query';
import { useOrders } from '@/services/orders/orders.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { OrdersStackParamList } from '@/navigation/types';
import type { Order, OrderStatus } from '@/types/order';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;

type OrderFilterKey = 'all' | 'active' | 'delivered' | 'returned';

const STATUS_FILTERS: Array<{ key: OrderFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'returned', label: 'Returned' },
];

const ACTIVE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'pending_payment',
  'payment_verified',
  'processing',
  'pick_list_generated',
  'dispatched',
  'rto_initiated',
]);

export function OrdersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const reorder = useReorderFromOrder();
  const [activeFilter, setActiveFilter] = useState<OrderFilterKey>('all');

  const listParams = useMemo(() => {
    if (activeFilter === 'delivered') return { status: 'delivered' as const };
    if (activeFilter === 'returned') return { returnsOnly: true as const };
    return undefined;
  }, [activeFilter]);

  const { data, isLoading, refetch } = useOrders(listParams);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allOrders = data?.data ?? [];
  const orders =
    activeFilter === 'active'
      ? allOrders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status))
      : allOrders;

  const handleReorder = useCallback(
    (order: Order) => {
      if (order.items.length === 0) return;
      reorder.mutate(
        order.items.map((it) => ({ variantId: it.variantId, qty: it.qty, name: it.name })),
        {
          onSuccess: ({ addedCount, failed }) => {
            if (addedCount === 0) {
              Toast.show({
                type: 'error',
                text1: 'Could not reorder',
                text2: 'None of the items are available for your delivery address.',
              });
              return;
            }
            if (failed.length > 0) {
              Toast.show({
                type: 'info',
                text1: `${addedCount} item${addedCount === 1 ? '' : 's'} added to cart`,
                text2: `${failed.length} unavailable for your address.`,
              });
            } else {
              Toast.show({
                type: 'success',
                text1: `${addedCount} item${addedCount === 1 ? '' : 's'} added to cart`,
              });
            }
            navigation.navigate('Cart');
          },
        },
      );
    },
    [navigation, reorder],
  );

  const handleOpenOrderSummary = useCallback(
    (order: Order) => navigation.navigate('OrderDetail', { orderId: order.id }),
    [navigation],
  );

  const handleReturn = useCallback(
    (order: Order) => navigation.navigate('ReturnSelectItems', { orderId: order.id }),
    [navigation],
  );

  const getFilterColor = (key: string): string => {
    const map: Record<string, string> = {
      active: colors.statusProcessing,
      delivered: colors.statusDelivered,
      returned: colors.statusReturned,
    };
    return map[key] ?? colors.brandNavy;
  };

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    chipsScroll: {
      flexGrow: 0,
    },
    chipsContainer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      alignItems: 'flex-start',
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: Radius.pill,
      marginRight: Spacing.sm,
      alignSelf: 'flex-start',
    },
    chipText: {
      fontSize: Typography.fsBody,
      lineHeight: Typography.fsBody + 4,
      fontWeight: Typography.fwMedium,
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="My Orders" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContainer}
      >
        {STATUS_FILTERS.map(({ key, label }) => {
          const active = key === activeFilter;
          const color = key === 'all' ? colors.brandNavy : getFilterColor(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, { backgroundColor: active ? color : colors.bgSection }]}
              onPress={() => setActiveFilter(key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
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
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.brandNavy]}
              tintColor={colors.brandNavy}
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onReorder={handleReorder}
              onPress={handleOpenOrderSummary}
              onReturn={handleReturn}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No orders found"
              subtitle={
                activeFilter === 'returned'
                  ? 'Orders whose return was accepted by the store will appear here. Pending return requests stay in All.'
                  : 'Your orders will appear here'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
