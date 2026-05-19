import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useOrder } from '@/services/orders/orders.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { OrdersStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;
type Route = RouteProp<OrdersStackParamList, 'ReturnSelectItems'>;

export function ReturnSelectItemsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const [selected, setSelected] = useState<string[]>([]);

  const { data: order, isLoading } = useOrder(orderId);

  const toggleItem = useCallback((itemId: string) => {
    setSelected((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  }, []);

  const handleContinue = useCallback(() => {
    navigation.navigate('ReturnReason', { orderId, itemIds: selected });
  }, [navigation, orderId, selected]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    orderInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
    },
    orderNum: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    orderDate: { fontSize: Typography.fsBody, color: colors.textSecondary },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
      gap: Spacing.md,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: { color: '#fff', fontSize: 14, fontWeight: Typography.fwBold },
    thumb: { width: 48, height: 48, borderRadius: Radius.sm, backgroundColor: colors.bgSection, justifyContent: 'center', alignItems: 'center' },
    thumbText: { fontSize: 12, fontWeight: Typography.fwBold, color: colors.brandNavy },
    itemInfo: { flex: 1 },
    itemName: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.textPrimary },
    itemMeta: { fontSize: Typography.fsLabel, color: colors.textTertiary },
    stickyBar: { padding: Spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.borderDivider },
  });

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Return Items" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  const dateText = (() => {
    try { return format(parseISO(order.createdAt), 'dd MMM yyyy'); } catch { return order.createdAt; }
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Return Items" showBack />
      <View style={styles.orderInfo}>
        <Text style={styles.orderNum}>{order.orderNumber}</Text>
        <Text style={styles.orderDate}>{dateText}</Text>
      </View>
      <FlatList
        data={order.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <TouchableOpacity style={styles.itemRow} onPress={() => toggleItem(item.id)} activeOpacity={0.85}>
              <View style={[styles.checkbox, { borderColor: isSelected ? colors.brandNavy : colors.borderInput, backgroundColor: isSelected ? colors.brandNavy : 'transparent' }]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.thumb}>
                {item.image ? (
                  <FastImage
                    source={{ uri: item.image }}
                    style={{ width: 48, height: 48, borderRadius: Radius.sm }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <Text style={styles.thumbText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.variant} × {item.qty}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <View style={styles.stickyBar}>
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={selected.length === 0} />
      </View>
    </SafeAreaView>
  );
}
