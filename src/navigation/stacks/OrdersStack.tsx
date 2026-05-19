import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OrdersScreen } from '@/screens/app/orders/OrdersScreen';
import { OrderDetailScreen } from '@/screens/app/orders/OrderDetailScreen';
import { InvoiceScreen } from '@/screens/app/orders/InvoiceScreen';
import { CartScreen } from '@/screens/app/cart/CartScreen';
import { PaymentScreen } from '@/screens/app/payment/PaymentScreen';
import { ManualPaymentUploadScreen } from '@/screens/app/payment/ManualPaymentUploadScreen';
import { PaymentPendingScreen } from '@/screens/app/payment/PaymentPendingScreen';
import { OrderSuccessScreen } from '@/screens/app/payment/OrderSuccessScreen';
import { ReturnSelectItemsScreen } from '@/screens/app/returns/ReturnSelectItemsScreen';
import { ReturnReasonScreen } from '@/screens/app/returns/ReturnReasonScreen';
import { ReturnPhotoUploadScreen } from '@/screens/app/returns/ReturnPhotoUploadScreen';
import { ReturnStatusScreen } from '@/screens/app/returns/ReturnStatusScreen';

import type { OrdersStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export type OrdersStackProps = {
  /** Default `Orders`. Use `Cart` for the bottom-tab cart entry. */
  initialRouteName?: keyof OrdersStackParamList;
};

export function OrdersStack({ initialRouteName = 'Orders' }: OrdersStackProps = {}) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Invoice" component={InvoiceScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="ManualPaymentUpload" component={ManualPaymentUploadScreen} />
      <Stack.Screen name="PaymentPending" component={PaymentPendingScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="ReturnSelectItems" component={ReturnSelectItemsScreen} />
      <Stack.Screen name="ReturnReason" component={ReturnReasonScreen} />
      <Stack.Screen name="ReturnPhotoUpload" component={ReturnPhotoUploadScreen} />
      <Stack.Screen name="ReturnStatus" component={ReturnStatusScreen} />
    </Stack.Navigator>
  );
}
