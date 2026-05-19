import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ServiceCatalogueScreen } from '@/screens/app/services/ServiceCatalogueScreen';
import { BookServiceScreen } from '@/screens/app/services/BookServiceScreen';
import { MyBookingsScreen } from '@/screens/app/services/MyBookingsScreen';
import { BookingDetailScreen } from '@/screens/app/services/BookingDetailScreen';
import { OtpGenerationScreen } from '@/screens/app/services/OtpGenerationScreen';
import { PartsApprovalScreen } from '@/screens/app/services/PartsApprovalScreen';
import { PaymentScreen } from '@/screens/app/payment/PaymentScreen';
import { ManualPaymentUploadScreen } from '@/screens/app/payment/ManualPaymentUploadScreen';
import { PaymentPendingScreen } from '@/screens/app/payment/PaymentPendingScreen';
import { OrderSuccessScreen } from '@/screens/app/payment/OrderSuccessScreen';
import { JobRatingScreen } from '@/screens/app/services/JobRatingScreen';
import { ServiceInvoiceScreen } from '@/screens/app/services/ServiceInvoiceScreen';
import { CancellationScreen } from '@/screens/app/services/CancellationScreen';

import type { ServicesStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<ServicesStackParamList>();

export function ServicesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServiceCatalogue" component={ServiceCatalogueScreen} />
      <Stack.Screen name="BookService" component={BookServiceScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="OtpGeneration" component={OtpGenerationScreen} />
      <Stack.Screen name="PartsApproval" component={PartsApprovalScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="ManualPaymentUpload" component={ManualPaymentUploadScreen} />
      <Stack.Screen name="PaymentPending" component={PaymentPendingScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="JobRating" component={JobRatingScreen} />
      <Stack.Screen name="ServiceInvoice" component={ServiceInvoiceScreen} />
      <Stack.Screen name="Cancellation" component={CancellationScreen} />
    </Stack.Navigator>
  );
}
