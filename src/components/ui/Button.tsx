import { useCallback } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-gray-100 active:bg-gray-200',
  outline: 'border border-gray-300 bg-transparent active:bg-gray-50',
  destructive: 'bg-destructive active:bg-destructive-dark',
  ghost: 'bg-transparent active:bg-gray-100',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-gray-900',
  outline: 'text-gray-900',
  destructive: 'text-white',
  ghost: 'text-gray-900',
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className,
}: AppButtonProps) {
  const handlePress = useCallback(() => {
    if (!isLoading && !disabled) {
      onPress();
    }
  }, [onPress, isLoading, disabled]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isLoading}
      className={cn(
        'h-12 items-center justify-center rounded-xl px-6',
        variantStyles[variant],
        (disabled || isLoading) && 'opacity-50',
        className,
      )}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'destructive' ? '#fff' : '#6366F1'} />
      ) : (
        <Text className={cn('font-sans-semibold text-base', variantTextStyles[variant])}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
