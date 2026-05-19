import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { useCategories } from '@/services/master/master.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

interface CategoryChipsProps {
  onSelect?: (categoryId: number | null) => void;
}

export function CategoryChips({ onSelect }: CategoryChipsProps) {
  const { colors } = useTheme();
  const [active, setActive] = useState<number | null>(null);
  const { data: categories } = useCategories();

  const handlePress = useCallback(
    (id: number) => {
      const next = active === id ? null : id;
      setActive(next);
      onSelect?.(next);
    },
    [active, onSelect],
  );

  const styles = StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.pill,
      marginRight: Spacing.sm,
    },
    label: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium },
  });

  if (!categories?.length) return null;

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => String(item.id)}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}
      renderItem={({ item }) => {
        const isActive = active === item.id;
        return (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.chip, { backgroundColor: isActive ? colors.brandNavy : colors.bgSection }]}
            onPress={() => handlePress(item.id)}
          >
            <Text style={[styles.label, { color: isActive ? '#fff' : colors.textSecondary }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}
