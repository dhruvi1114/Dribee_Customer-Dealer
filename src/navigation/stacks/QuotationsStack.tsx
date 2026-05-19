import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { QuotationsScreen } from '@/screens/app/quotations/QuotationsScreen';
import { QuotationDetailScreen } from '@/screens/app/quotations/QuotationDetailScreen';

import type { QuotationsStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<QuotationsStackParamList>();

export function QuotationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Quotations" component={QuotationsScreen} />
      <Stack.Screen name="QuotationDetail" component={QuotationDetailScreen} />
    </Stack.Navigator>
  );
}
