import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Home, BookOpen, Wrench, ShoppingCart, FileText, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useAppSelector } from '@/store/hooks';
import { useLocationBootstrap } from '@/hooks/useLocationBootstrap';
import { useStorefrontLocationSync } from '@/hooks/useStorefrontLocationSync';
import { useProfile } from '@/services/auth/auth.query';
import { HomeStack } from '@/navigation/stacks/HomeStack';
import { CatalogueStack } from '@/navigation/stacks/CatalogueStack';
import { ServicesStack } from '@/navigation/stacks/ServicesStack';
import { OrdersStack } from '@/navigation/stacks/OrdersStack';
import { QuotationsStack } from '@/navigation/stacks/QuotationsStack';
import { ProfileStack } from '@/navigation/stacks/ProfileStack';
import { LightColors } from '@/constants/colors';

import type { AppTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<AppTabParamList>();

/** Same stack as former Orders tab, but initial screen is Cart for the bottom bar. */
function CartTabStack() {
  return <OrdersStack initialRouteName="Cart" />;
}

/** Return detail opened from Profile — hide tab bar like return flow in Orders. */
const PROFILE_TAB_HIDE_ROUTES = new Set(['ReturnStatus']);

export function AppTabs() {
  const user = useAppSelector((s) => s.auth.user);
  const isDealer = user?.role === 'dealer_owner';
  const showServices =
    user?.serviceModuleEnabled !== false &&
    (isDealer ? user?.dealerModuleEnabled !== false : true);
  useProfile();
  useLocationBootstrap();
  useStorefrontLocationSync();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const focusedRoute =
          getFocusedRouteNameFromRoute(route) ?? (route.name === 'CartTab' ? 'Cart' : 'Home');
        const paymentFlowRoutes = new Set([
          'OrderDetail',
          'Invoice',
          'Payment',
          'ManualPaymentUpload',
          'PaymentPending',
          'OrderSuccess',
          'ReturnSelectItems',
          'ReturnReason',
          'ReturnPhotoUpload',
          'ReturnStatus',
        ]);
        const hideTabBar =
          (route.name === 'CartTab' && paymentFlowRoutes.has(focusedRoute)) ||
          (route.name === 'ServicesTab' && paymentFlowRoutes.has(focusedRoute)) ||
          (route.name === 'ProfileTab' && PROFILE_TAB_HIDE_ROUTES.has(focusedRoute));

        return {
        headerShown: false,
        tabBarActiveTintColor: LightColors.brandNavy,
        tabBarInactiveTintColor: LightColors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: hideTabBar ? { display: 'none' } : styles.tabBar,
        tabBarIcon: ({ color, focused }) => {
          const size = 22;
          const icons: Record<string, React.ReactElement> = {
            HomeTab: <Home size={size} color={color} strokeWidth={1.5} />,
            CatalogueTab: <BookOpen size={size} color={color} strokeWidth={1.5} />,
            ServicesTab: <Wrench size={size} color={color} strokeWidth={1.5} />,
            CartTab: <ShoppingCart size={size} color={color} strokeWidth={1.5} />,
            QuotationsTab: <FileText size={size} color={color} strokeWidth={1.5} />,
            ProfileTab: <User size={size} color={color} strokeWidth={1.5} />,
          };
          return (
            <View style={{ alignItems: 'center' }}>
              {focused && <View style={styles.indicator} />}
              {icons[route.name]}
            </View>
          );
        },
      };
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="CatalogueTab" component={CatalogueStack} options={{ tabBarLabel: 'Catalogue' }} />
      <Tab.Screen
        name="CartTab"
        component={CartTabStack}
        options={{ tabBarLabel: 'Cart' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CartTab', { screen: 'Cart', initial: false });
          },
        })}
      />
      {showServices && (
        <Tab.Screen name="ServicesTab" component={ServicesStack} options={{ tabBarLabel: 'Services' }} />
      )}
      {/*
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{ tabBarLabel: 'Orders' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('OrdersTab', { screen: 'Orders' });
          },
        })}
      />
      */}
      {isDealer && (
        <Tab.Screen name="QuotationsTab" component={QuotationsStack} options={{ tabBarLabel: 'Quotes' }} />
      )}
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: LightColors.borderDivider,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: { fontSize: 10, fontWeight: '500' },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: LightColors.brandAmber,
  },
});
