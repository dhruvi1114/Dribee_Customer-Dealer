import { useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env, isProd } from '@/config/env';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLLAPSED_SIZE = 18;

const ENV_COLORS: Record<string, string> = {
  local: '#F59E0B',
  development: '#3B82F6',
  production: '#10B981',
};

const ENV_SHORT: Record<string, string> = {
  local: 'L',
  development: 'D',
  production: 'P',
};

/**
 * Draggable floating environment indicator.
 * - Drag it anywhere on screen so it never blocks your UI.
 * - Tap to expand (shows env name + API URL). Tap again to collapse.
 * - Hidden in production builds.
 */
export function EnvBadge() {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  // Position tracked as Animated.Value for smooth dragging
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_W - COLLAPSED_SIZE - 12, y: 0 })).current;

  // Track whether the gesture was a drag or a tap
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) {
          isDragging.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, g);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Clamp within screen bounds
        const curX = (pan.x as any)._value;
        const curY = (pan.y as any)._value;
        const clampedX = Math.max(0, Math.min(curX, SCREEN_W - COLLAPSED_SIZE));
        const clampedY = Math.max(0, Math.min(curY, SCREEN_H - insets.bottom - COLLAPSED_SIZE));
        if (curX !== clampedX || curY !== clampedY) {
          Animated.spring(pan, {
            toValue: { x: clampedX, y: clampedY },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  if (isProd || !__DEV__) return null;

  const color = ENV_COLORS[env.APP_ENV] || '#6B7280';
  const shortLabel = ENV_SHORT[env.APP_ENV] || '?';

  const handlePress = () => {
    if (!isDragging.current) {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        top: insets.top + 4,
        left: 0,
        zIndex: 9999,
        transform: pan.getTranslateTransform(),
      }}
    >
      {expanded ? (
        <Pressable
          onPress={handlePress}
          style={{
            backgroundColor: color,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            opacity: 0.92,
            maxWidth: 280,
            elevation: 5,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text
            style={{
              color: '#FFF',
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            {env.APP_ENV}
          </Text>
          <Text
            style={{ color: 'rgba(255,255,255,0.75)', fontSize: 8, marginTop: 2 }}
            numberOfLines={1}
          >
            {env.API_BASE_URL}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={handlePress}
          style={{
            width: COLLAPSED_SIZE,
            height: COLLAPSED_SIZE,
            borderRadius: COLLAPSED_SIZE / 2,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
            elevation: 5,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800' }}>{shortLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}
