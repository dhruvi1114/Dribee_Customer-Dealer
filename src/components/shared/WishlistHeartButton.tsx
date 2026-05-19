import { useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { useAppSelector } from '@/store/hooks';
import {
  useAddWishlistItem,
  useIsInWishlist,
  useRemoveWishlistItem,
} from '@/services/wishlist/wishlist.query';

interface WishlistHeartButtonProps {
  variantId: number | null | undefined;
  size?: number;
  variant?: 'overlay' | 'plain';
}

export function WishlistHeartButton({
  variantId,
  size = 16,
  variant = 'overlay',
}: WishlistHeartButtonProps) {
  const { colors } = useTheme();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const inWishlist = useIsInWishlist(variantId);
  const addMutation = useAddWishlistItem();
  const removeMutation = useRemoveWishlistItem();

  const onPress = useCallback(() => {
    if (variantId == null) return;
    if (inWishlist) {
      removeMutation.mutate(variantId);
    } else {
      addMutation.mutate({ variantId });
    }
  }, [variantId, inWishlist, addMutation, removeMutation]);

  if (!isAuthenticated || variantId == null) return null;

  const styles = StyleSheet.create({
    overlay: {
      width: size + 16,
      height: size + 16,
      borderRadius: (size + 16) / 2,
      backgroundColor: colors.bgCard,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    plain: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={variant === 'overlay' ? styles.overlay : styles.plain}
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={8}
    >
      <Heart
        size={size}
        color={inWishlist ? '#EF4444' : colors.textTertiary}
        fill={inWishlist ? '#EF4444' : 'transparent'}
        strokeWidth={1.5}
      />
    </TouchableOpacity>
  );
}
