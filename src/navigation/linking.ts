import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['rnboilerplate://', 'https://yourapp.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
      App: {
        screens: {
          HomeTab: 'home',
          CatalogueTab: 'catalogue',
          ServicesTab: 'services',
          CartTab: 'cart',
          // OrdersTab: 'orders',
          ProfileTab: 'profile',
        },
      },
    },
  },
};
