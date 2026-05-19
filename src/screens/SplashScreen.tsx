import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useAppSelector } from '@/store/hooks';
import { env } from '@/config/env';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 600 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

    const timer = setTimeout(() => {
      navigation.replace(isAuthenticated ? 'App' : 'Auth', undefined as never);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, logoOpacity, logoScale, navigation, taglineOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, logoStyle]}>
        <Text style={styles.wordmark}>{env.APP_NAME}</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Your parts. Your service.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3353',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { alignItems: 'center' },
  wordmark: { fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
});
