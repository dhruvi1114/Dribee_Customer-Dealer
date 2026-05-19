import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Search, ShoppingCart, Bell } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showCart?: boolean;
  showBell?: boolean;
  cartCount?: number;
  bellUnread?: boolean;
  onSearchPress?: () => void;
  onCartPress?: () => void;
  onBellPress?: () => void;
  rightComponent?: React.ReactNode;
}

export function Header({
  title,
  showBack = false,
  showSearch = false,
  showCart = false,
  showBell = false,
  cartCount = 0,
  bellUnread = false,
  onSearchPress,
  onCartPress,
  onBellPress,
  rightComponent,
}: HeaderProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.bgHeader,
      paddingTop: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 0,
      elevation: 2,
    },
    left: { width: 40, alignItems: 'flex-start' },
    center: { flex: 1, alignItems: 'center' },
    right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    title: {
      fontSize: Typography.fsScreen,
      fontWeight: Typography.fwSemibold,
      color: colors.textPrimary,
    },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },
    cartBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.brandAmber,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3,
    },
    cartBadgeText: { fontSize: 10, color: '#fff', fontWeight: Typography.fwBold },
  });

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
            <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>
      <View style={styles.right}>
        {showSearch && (
          <TouchableOpacity onPress={onSearchPress} style={styles.iconBtn}>
            <Search size={22} color={colors.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        {showCart && (
          <TouchableOpacity onPress={onCartPress} style={styles.iconBtn}>
            <ShoppingCart size={22} color={colors.textPrimary} strokeWidth={1.5} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {showBell && (
          <TouchableOpacity onPress={onBellPress} style={styles.iconBtn}>
            <Bell size={22} color={colors.textPrimary} strokeWidth={1.5} />
            {bellUnread && <View style={styles.badge} />}
          </TouchableOpacity>
        )}
        {rightComponent}
      </View>
    </View>
  );
}
