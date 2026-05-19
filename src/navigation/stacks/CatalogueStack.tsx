import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CatalogueScreen } from '@/screens/app/catalogue/CatalogueScreen';
import { ProductDetailScreen } from '@/screens/app/catalogue/ProductDetailScreen';
import { SearchScreen } from '@/screens/app/catalogue/SearchScreen';
import { WishlistScreen } from '@/screens/app/wishlist/WishlistScreen';

import type { CatalogueStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<CatalogueStackParamList>();

export function CatalogueStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Catalogue" component={CatalogueScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
    </Stack.Navigator>
  );
}
