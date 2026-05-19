import { useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Radius } from '@/constants/spacing';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined';
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  height?: number;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'filled',
  color,
  disabled = false,
  loading = false,
  fullWidth = true,
  height = 54,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const btnColor = color ?? colors.brandAmber;

  const handlePress = useCallback(() => {
    if (!disabled && !loading) onPress();
  }, [disabled, loading, onPress]);

  const styles = StyleSheet.create({
    btn: {
      height,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: fullWidth ? 'stretch' : 'auto',
      opacity: disabled ? 0.5 : 1,
      backgroundColor: variant === 'filled' ? btnColor : 'transparent',
      borderWidth: variant === 'outlined' ? 1.5 : 0,
      borderColor: variant === 'outlined' ? btnColor : 'transparent',
      paddingHorizontal: 24,
    },
    label: {
      fontSize: Typography.fsButton,
      fontWeight: Typography.fwSemibold,
      color: variant === 'filled' ? '#FFFFFF' : btnColor,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.btn}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? '#FFFFFF' : btnColor} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
