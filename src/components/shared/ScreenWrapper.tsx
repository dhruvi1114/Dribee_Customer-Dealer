import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/utils';

interface ScreenWrapperProps {
  children: React.ReactNode;
  withPadding?: boolean;
  className?: string;
}

export function ScreenWrapper({ children, withPadding = true, className }: ScreenWrapperProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className={cn('flex-1', withPadding && 'px-4', className)}>
        {children}
      </View>
    </SafeAreaView>
  );
}
