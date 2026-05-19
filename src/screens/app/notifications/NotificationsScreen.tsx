import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { NotificationItem } from '@/components/orders/NotificationItem';
import { EmptyState } from '@/components/common/EmptyState';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/services/notifications/notifications.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { NotificationType } from '@/types/notification';

const FILTERS: Array<{ label: string; type?: NotificationType }> = [
  { label: 'All' },
  { label: 'Orders', type: 'order' },
  { label: 'Offers', type: 'offer' },
  { label: 'Alerts', type: 'alert' },
];

export function NotificationsScreen() {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<NotificationType | undefined>(undefined);

  const { data, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = (data?.notifications ?? []).filter(
    (n) => !activeFilter || n.type === activeFilter,
  );

  const handleMarkRead = useCallback(
    (id: string) => markReadMutation.mutate(id),
    [markReadMutation],
  );

  const handleMarkAllRead = useCallback(
    () => markAllReadMutation.mutate(),
    [markAllReadMutation],
  );

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.pill, marginRight: Spacing.sm },
    chipText: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Notifications"
        showBack
        rightComponent={
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.85}>
            <Text style={{ fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium }}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
        {FILTERS.map((f) => {
          const active = f.type === activeFilter;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, { backgroundColor: active ? colors.brandNavy : colors.bgSection }]}
              onPress={() => setActiveFilter(f.type)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
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
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleMarkRead}
              onDismiss={handleMarkRead}
            />
          )}
          ListEmptyComponent={<EmptyState title="No notifications" subtitle="You're all caught up!" />}
        />
      )}
    </SafeAreaView>
  );
}
