import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Plus, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useOrder } from '@/services/orders/orders.query';
import { useCreateReturn, useUploadReturnEvidence } from '@/services/returns/returns.query';
import type { CreateReturnItem } from '@/types/return';
import type { OrdersStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;
type Route = RouteProp<OrdersStackParamList, 'ReturnPhotoUpload'>;

export function ReturnPhotoUploadScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId, items: itemsParam, notes } = route.params;
  const [photos, setPhotos] = useState<string[]>([]);

  const { data: order } = useOrder(orderId);
  const uploadEvidence = useUploadReturnEvidence();
  const createReturn = useCreateReturn();
  const isPending = uploadEvidence.isPending || createReturn.isPending;

  const handleAddPhoto = useCallback(async () => {
    if (photos.length >= 4) return;
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets?.[0]?.uri) {
      setPhotos((prev) => [...prev, result.assets![0].uri!]);
    }
  }, [photos.length]);

  const handleRemove = useCallback((uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (photos.length === 0 || !order) return;

    let evidenceUrls: string[] = [];
    try {
      evidenceUrls = await uploadEvidence.mutateAsync(photos);
    } catch {
      // Upload mutation already toasts on error.
      return;
    }
    if (evidenceUrls.length === 0) {
      Toast.show({ type: 'error', text1: 'Could not upload photos. Try again.' });
      return;
    }

    const items: CreateReturnItem[] = itemsParam.map(({ id, returnReasonId, qty }) => ({
      order_item_id: id,
      qty,
      return_reason_id: returnReasonId,
    }));

    createReturn.mutate(
      {
        orderId,
        data: { items, notes, evidence_urls: evidenceUrls },
      },
      {
        onSuccess: (created) => {
          navigation.replace('ReturnStatus', { returnId: created.id, initialReturn: created });
        },
      },
    );
  }, [createReturn, itemsParam, navigation, notes, order, orderId, photos, uploadEvidence]);

  const slots = [...photos, ...Array(Math.max(0, 4 - photos.length)).fill(null)];

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    instruction: {
      fontSize: Typography.fsBody,
      color: colors.textSecondary,
      margin: Spacing.lg,
      lineHeight: 22,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.md },
    photoBox: {
      width: '47%',
      aspectRatio: 1,
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    emptyBox: {
      width: '47%',
      aspectRatio: 1,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      gap: Spacing.sm,
    },
    emptyBoxText: { fontSize: Typography.fsBody, color: colors.textTertiary },
    filledBox: {
      width: '47%',
      aspectRatio: 1,
      borderRadius: Radius.lg,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoText: { fontSize: Typography.fsLabel, color: colors.textSecondary },
    removeBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center' },
    stickyBar: { padding: Spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.borderDivider, marginTop: 'auto' },
  });

  const submitLabel = uploadEvidence.isPending
    ? 'Uploading…'
    : createReturn.isPending
    ? 'Submitting…'
    : 'Submit Return Request';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Upload Evidence" showBack />
      <Text style={styles.instruction}>
        Please upload clear photos of the items you&apos;re returning (max 4 photos)
      </Text>
      <View style={styles.grid}>
        {slots.map((uri, i) =>
          uri ? (
            <View key={i} style={styles.filledBox}>
              <Text style={styles.photoText}>Photo {i + 1} ✓</Text>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(uri as string)} activeOpacity={0.85}>
                <X size={14} color={colors.statusReturned} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity key={`empty-${i}`} style={styles.emptyBox} onPress={handleAddPhoto} activeOpacity={0.85}>
              <Plus size={28} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyBoxText}>Add Photo</Text>
            </TouchableOpacity>
          ),
        )}
      </View>
      <View style={{ flex: 1 }} />
      <View style={styles.stickyBar}>
        <PrimaryButton
          label={submitLabel}
          onPress={handleSubmit}
          disabled={photos.length === 0 || isPending || !order}
        />
      </View>
    </SafeAreaView>
  );
}
