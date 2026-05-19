import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PackageOpen } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, actionLabel, onAction, icon }: EmptyStateProps) {
  const { colors } = useTheme();

  const handleAction = useCallback(() => {
    onAction?.();
  }, [onAction]);

  const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: Typography.fsSection,
      fontWeight: Typography.fwSemibold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fsBody,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    btn: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: 20,
      backgroundColor: colors.brandAmber,
    },
    btnLabel: {
      fontSize: Typography.fsButton,
      fontWeight: Typography.fwSemibold,
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        {icon ?? <PackageOpen size={40} color={colors.textTertiary} strokeWidth={1.5} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity activeOpacity={0.85} style={styles.btn} onPress={handleAction}>
          <Text style={styles.btnLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
