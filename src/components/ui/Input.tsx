import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { cn } from '@/lib/utils';

import type { TextInputProps } from 'react-native';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function AppInput({
  label,
  error,
  secureTextEntry,
  containerClassName,
  className,
  ...props
}: AppInputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecure = useCallback(() => {
    setIsSecure((prev) => !prev);
  }, []);

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label && (
        <Text className="font-sans-medium text-sm text-gray-700">{label}</Text>
      )}
      <View className="relative">
        <TextInput
          className={cn(
            'h-12 rounded-xl border bg-white px-4 font-sans text-base text-gray-900',
            error ? 'border-destructive' : 'border-gray-200 focus:border-primary-500',
            secureTextEntry && 'pr-12',
            className,
          )}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <Pressable
            onPress={toggleSecure}
            className="absolute right-3 top-0 bottom-0 justify-center"
          >
            {isSecure ? (
              <EyeOff size={20} strokeWidth={1.5} color="#9CA3AF" />
            ) : (
              <Eye size={20} strokeWidth={1.5} color="#9CA3AF" />
            )}
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="font-sans text-xs text-destructive">{error}</Text>
      )}
    </View>
  );
}
