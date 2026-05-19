import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

const BANNERS = [
  { id: '1', title: 'Genuine Parts\nDelivered Fast', subtitle: 'OEM quality at dealer prices', cta: 'Shop Now' },
  { id: '2', title: 'Book a Service\nToday', subtitle: 'Certified professionals at your door', cta: 'Book Now' },
  { id: '3', title: 'Exclusive Dealer\nOffers', subtitle: 'Volume discounts & priority support', cta: 'Explore' },
];

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - Spacing.lg * 2;

export function BannerCarousel() {
  const { colors } = useTheme();
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % BANNERS.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoScroll]);

  const handleScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActive(idx);
  }, []);

  const styles = StyleSheet.create({
    container: { marginHorizontal: Spacing.lg, marginVertical: Spacing.md },
    banner: {
      width: BANNER_WIDTH,
      height: 160,
      borderRadius: Radius.lg,
      backgroundColor: colors.brandNavy,
      padding: Spacing.xl,
      justifyContent: 'flex-end',
    },
    title: { fontSize: 20, fontWeight: Typography.fwBold, color: '#fff' },
    subtitle: { fontSize: Typography.fsBody, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    cta: {
      alignSelf: 'flex-start',
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.sm,
      backgroundColor: colors.brandAmber,
    },
    ctaText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' },
    dots: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.sm, gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderCard },
    dotActive: { backgroundColor: colors.brandAmber, width: 18 },
  });

  return (
    <View>
      <FlatList
        ref={listRef}
        data={BANNERS}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={styles.banner}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
              <Text style={styles.ctaText}>{item.cta}</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.lg }}
        style={{ marginHorizontal: -Spacing.lg }}
      />
      <View style={styles.dots}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}
