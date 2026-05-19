import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';

import type { BaseToastProps } from 'react-native-toast-message';

function SuccessToast({ text1 }: BaseToastProps) {
  return (
    <View className="mx-4 mt-2 flex-row items-center gap-3 rounded-xl bg-green-50 px-4 py-3 shadow-sm">
      <CheckCircle size={20} strokeWidth={1.5} color="#16A34A" />
      <Text className="flex-1 font-sans-medium text-sm text-green-800">{text1}</Text>
    </View>
  );
}

function ErrorToast({ text1 }: BaseToastProps) {
  return (
    <View className="mx-4 mt-2 flex-row items-center gap-3 rounded-xl bg-red-50 px-4 py-3 shadow-sm">
      <XCircle size={20} strokeWidth={1.5} color="#DC2626" />
      <Text className="flex-1 font-sans-medium text-sm text-red-800">{text1}</Text>
    </View>
  );
}

function InfoToast({ text1 }: BaseToastProps) {
  return (
    <View className="mx-4 mt-2 flex-row items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 shadow-sm">
      <Info size={20} strokeWidth={1.5} color="#2563EB" />
      <Text className="flex-1 font-sans-medium text-sm text-blue-800">{text1}</Text>
    </View>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => <SuccessToast {...props} />,
  error: (props: BaseToastProps) => <ErrorToast {...props} />,
  info: (props: BaseToastProps) => <InfoToast {...props} />,
};

export { Toast };
