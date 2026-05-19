import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileScreen } from '@/screens/app/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/app/profile/EditProfileScreen';
import { AddressesScreen } from '@/screens/app/profile/AddressesScreen';
import { NotificationsScreen } from '@/screens/app/notifications/NotificationsScreen';
import { WishlistScreen } from '@/screens/app/wishlist/WishlistScreen';
import { ReturnsListScreen } from '@/screens/app/returns/ReturnsListScreen';
import { ReturnStatusScreen } from '@/screens/app/returns/ReturnStatusScreen';

import type { ProfileStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="ReturnsList" component={ReturnsListScreen} />
      <Stack.Screen name="ReturnStatus" component={ReturnStatusScreen} />
    </Stack.Navigator>
  );
}
