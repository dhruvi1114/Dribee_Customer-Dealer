import { ActivityIndicator, View } from 'react-native';

import { LightColors } from '@/constants/colors';

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color={LightColors.brandBlue} />
    </View>
  );
}
