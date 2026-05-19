import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeContext';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLoader({ width, height, borderRadius = 8, style }: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.shimmerBase, colors.shimmerShine],
    ),
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.flatten([{ width, height, borderRadius }]),
        animStyle,
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, margin: 6, backgroundColor: colors.bgCard, borderRadius: 12, padding: 10 }}>
      <SkeletonLoader width="100%" height={140} borderRadius={8} />
      <View style={{ marginTop: 8, gap: 6 }}>
        <SkeletonLoader width="80%" height={14} />
        <SkeletonLoader width="50%" height={11} />
        <SkeletonLoader width="40%" height={20} />
        <SkeletonLoader width="100%" height={32} borderRadius={8} />
      </View>
    </View>
  );
}
