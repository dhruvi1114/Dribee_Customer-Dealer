import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Package, Tag, AlertCircle, Wrench, CreditCard, Bell, X } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { Notification, NotificationType } from '@/types/notification';

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  order: Package,
  offer: Tag,
  alert: AlertCircle,
  service: Wrench,
  payment: CreditCard,
  system: Bell,
};

const TYPE_COLOR_KEY: Record<NotificationType, 'brandNavy' | 'brandAmber' | 'brandTeal'> = {
  order: 'brandNavy',
  offer: 'brandAmber',
  alert: 'brandTeal',
  service: 'brandNavy',
  payment: 'brandAmber',
  system: 'brandTeal',
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss?: (id: string) => void;
  onPress?: (id: string) => void;
}

export function NotificationItem({ notification, onDismiss, onPress }: NotificationItemProps) {
  const { colors } = useTheme();
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const iconColor = colors[TYPE_COLOR_KEY[notification.type] ?? 'brandNavy'];
  const isUnread = !notification.isRead;

  const handleDismiss = useCallback(() => onDismiss?.(notification.id), [onDismiss, notification.id]);
  const handlePress = useCallback(() => onPress?.(notification.id), [onPress, notification.id]);

  const timeText = (() => {
    try { return format(parseISO(notification.createdAt), 'hh:mm a'); } catch { return ''; }
  })();

  const styles = StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: isUnread ? colors.bgSection : colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderLeftWidth: isUnread ? 3 : 0,
      borderLeftColor: iconColor,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: iconColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    content: { flex: 1 },
    title: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    message: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    time: { fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: 4 },
    dismiss: { padding: 4 },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={iconColor} strokeWidth={1.5} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.time}>{timeText}</Text>
      </View>
      <TouchableOpacity style={styles.dismiss} onPress={handleDismiss} activeOpacity={0.85}>
        <X size={16} color={colors.textTertiary} strokeWidth={1.5} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
