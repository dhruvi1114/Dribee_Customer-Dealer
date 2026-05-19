import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/theme/ThemeContext';
import { useAppSelector } from '@/store/hooks';
import { useWishlist } from '@/services/wishlist/wishlist.query';

interface WishlistHeaderIconProps {
  size?: number;
}

export function WishlistHeaderIcon({ size = 22 }: WishlistHeaderIconProps) {
  const { colors } = useTheme();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const { data } = useWishlist(isAuthenticated);
  const count = data?.count ?? 0;

  if (!isAuthenticated) return null;

  const styles = StyleSheet.create({
    btn: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      borderRadius: 8,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
  });

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => navigation.navigate('Wishlist')}
      activeOpacity={0.7}
      hitSlop={8}
    >
      <Heart size={size} color={colors.textPrimary} strokeWidth={1.5} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
