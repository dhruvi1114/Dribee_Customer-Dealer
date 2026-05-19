import { View, Text } from 'react-native';
import { Inbox } from 'lucide-react-native';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No data',
  message = 'Nothing to show here yet.',
  icon,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center px-6 py-12', className)}>
      {icon ?? <Inbox size={48} strokeWidth={1.5} color="#D1D5DB" />}
      <Text className="mt-4 font-sans-semibold text-lg text-gray-900">{title}</Text>
      <Text className="mt-1 text-center font-sans text-sm text-gray-500">{message}</Text>
    </View>
  );
}
