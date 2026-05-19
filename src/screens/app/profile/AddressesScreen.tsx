import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Briefcase, MapPin, Pencil, Trash2, Plus } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { AppDropdown } from '@/components/ui/Dropdown';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from '@/services/addresses/addresses.query';
import { useStates, useCities, useZones, useAreas } from '@/services/master/master.query';
import { useCartChangedSheet } from '@/components/cart/CartChangedSheetProvider';
import { hasMaterialDiff, useSetCartAddress } from '@/services/cart/cart.query';
import type { CustomerAddress } from '@/types/address';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resolveWarehouseThunk } from '@/store/slices/locationSlice';

const LABEL_ICONS: Record<string, React.ElementType> = { Home, Office: Briefcase };

interface FormState {
  label: string;
  address_line: string;
  landmark: string;
  pincode: string;
  city_id: string;
  zone_id: string;
  area_id: string;
}

const emptyForm: FormState = {
  label: '',
  address_line: '',
  landmark: '',
  pincode: '',
  city_id: '',
  zone_id: '',
  area_id: '',
};

export function AddressesScreen() {
  const { colors } = useTheme();
  const { data: addresses = [], isLoading, refetch, isRefetching } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const setCartAddress = useSetCartAddress();
  const cartChangedSheet = useCartChangedSheet();
  const dispatch = useAppDispatch();
  const selectedAddressId = useAppSelector((s) => s.location.selectedAddressId);

  // Resolves warehouse + retargets the cart at the picked address. Called after
  // save / set-default so prices and stock immediately reflect the new delivery
  // location. When the switch produces material changes (dropped items, price
  // changes, coupon removed), we surface CartChangedSheet so the user can
  // confirm or revert.
  const applyAddressAsDelivery = useCallback(
    (addr: CustomerAddress) => {
      if (!addr.pincode && addr.latitude === null && addr.longitude === null) return;
      void dispatch(
        resolveWarehouseThunk({
          pincode: addr.pincode ?? undefined,
          lat: addr.latitude ?? undefined,
          lng: addr.longitude ?? undefined,
          source: 'address',
          addressId: addr.id,
          label: addr.label ?? addr.address_line,
        }),
      );
      const numericId = Number(addr.id);
      const previousAddressNumericId = selectedAddressId ? Number(selectedAddressId) : null;
      if (Number.isFinite(numericId)) {
        setCartAddress.mutate(
          { deliveryAddressId: numericId },
          {
            onSuccess: (result) => {
              if (hasMaterialDiff(result)) {
                cartChangedSheet.present({
                  result,
                  previousAddressId:
                    previousAddressNumericId !== null && Number.isFinite(previousAddressNumericId)
                      ? previousAddressNumericId
                      : null,
                });
              }
            },
          },
        );
      }
    },
    [dispatch, setCartAddress, selectedAddressId, cartChangedSheet],
  );

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [stateName, setStateName] = useState('');

  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCities(stateName || undefined);
  const { data: zones = [] } = useZones(form.city_id || undefined);
  const { data: areas = [] } = useAreas(form.zone_id || undefined);

  const stateItems = states.map((s) => ({ label: s.name, value: s.name }));
  const cityItems = cities.map((c) => ({ label: c.name, value: String(c.id) }));
  const zoneItems = zones.map((z) => ({ label: z.name, value: String(z.id) }));
  const areaItems = areas.map((a) => ({ label: a.name, value: String(a.id) }));

  useEffect(() => {
    if (!showModal) {
      setForm(emptyForm);
      setEditingId(null);
      setStateName('');
    }
  }, [showModal]);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((a: CustomerAddress) => {
    setEditingId(a.id);
    setForm({
      label: a.label ?? '',
      address_line: a.address_line,
      landmark: a.landmark ?? '',
      pincode: a.pincode ?? '',
      city_id: a.city_id ?? '',
      zone_id: a.zone_id ?? '',
      area_id: a.area_id ?? '',
    });
    setShowModal(true);
  }, []);

  const handleSetDefault = useCallback(
    (id: string) => {
      const addr = addresses.find((a) => a.id === id);
      setDefault.mutate(id, {
        onSuccess: () => {
          if (addr) applyAddressAsDelivery(addr);
        },
      });
    },
    [setDefault, addresses, applyAddressAsDelivery],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete address?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAddress.mutate(id) },
      ]);
    },
    [deleteAddress],
  );

  const handleSave = useCallback(() => {
    if (!form.address_line.trim()) {
      Alert.alert('Address is required');
      return;
    }
    const pincode = form.pincode.trim();
    if (!/^\d{6}$/.test(pincode)) {
      Alert.alert('Pincode must be 6 digits');
      return;
    }

    const hasAnyAddress = addresses.length > 0;
    const isEditingDefault =
      editingId !== null && addresses.find((a) => a.id === editingId)?.is_default === true;

    const basePayload = {
      label: form.label.trim() || undefined,
      address_line: form.address_line.trim(),
      landmark: form.landmark.trim() || undefined,
      pincode,
      city_id: form.city_id.trim() || undefined,
      zone_id: form.zone_id.trim() || undefined,
      area_id: form.area_id.trim() || undefined,
    };

    if (editingId) {
      updateAddress.mutate(
        { id: editingId, data: basePayload },
        {
          onSuccess: (saved) => {
            setShowModal(false);
            if (isEditingDefault) applyAddressAsDelivery(saved);
          },
        },
      );
    } else {
      const payload = hasAnyAddress ? basePayload : { ...basePayload, is_default: true };
      createAddress.mutate(payload, {
        onSuccess: (saved) => {
          setShowModal(false);
          if (!hasAnyAddress) applyAddressAsDelivery(saved);
        },
      });
    }
  }, [form, editingId, addresses, createAddress, updateAddress, applyAddressAsDelivery]);

  const isSaving = createAddress.isPending || updateAddress.isPending;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    addBtnText: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: colors.textPrimary, flex: 1 },
    defaultBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.sm,
      backgroundColor: colors.statusDelivered + '20',
    },
    defaultText: { fontSize: 10, color: colors.statusDelivered, fontWeight: Typography.fwSemibold },
    addressText: { fontSize: Typography.fsBody, color: colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
    actionRow: { flexDirection: 'row', gap: Spacing.md },
    defaultBtn: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.sm,
      borderWidth: 1.5,
      borderColor: colors.borderCard,
      alignItems: 'center',
    },
    defaultBtnText: { fontSize: Typography.fsBody, color: colors.textSecondary },
    iconBtn: { padding: Spacing.sm, borderRadius: Radius.sm, backgroundColor: colors.bgSection },
    modal: { flex: 1, backgroundColor: colors.bgOverlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: Spacing.xl,
      maxHeight: '85%',
    },
    sheetTitle: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.textPrimary, marginBottom: Spacing.xl },
    fieldLabel: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
    },
    input: {
      height: 48,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.sm,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
    },
    empty: { alignItems: 'center', padding: Spacing.xl },
    emptyText: { fontSize: Typography.fsBody, color: colors.textSecondary, marginTop: Spacing.md },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Saved Addresses"
        showBack
        rightComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Plus size={16} color={colors.brandBlue} strokeWidth={2} />
            <Text style={styles.addBtnText}>Add New</Text>
          </TouchableOpacity>
        }
      />
      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.brandBlue} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MapPin size={40} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No addresses yet. Add your first one.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const Icon = item.label ? LABEL_ICONS[item.label] ?? MapPin : MapPin;
            const locationLine = [item.area_name, item.zone_name, item.city_name].filter(Boolean).join(', ');
            return (
              <View style={styles.card}>
                <View style={styles.topRow}>
                  <View style={styles.iconWrap}>
                    <Icon size={16} color={colors.textSecondary} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.label}>{item.label ?? 'Address'}</Text>
                  {item.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>
                  {item.address_line}
                  {item.landmark ? `\nNear ${item.landmark}` : ''}
                  {locationLine ? `\n${locationLine}` : ''}
                </Text>
                <View style={styles.actionRow}>
                  {!item.is_default && (
                    <TouchableOpacity
                      style={styles.defaultBtn}
                      onPress={() => handleSetDefault(item.id)}
                      activeOpacity={0.85}
                      disabled={setDefault.isPending}
                    >
                      <Text style={styles.defaultBtnText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)} activeOpacity={0.85}>
                    <Pencil size={16} color={colors.textSecondary} strokeWidth={1.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: colors.statusReturned + '15' }]}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.85}
                  >
                    <Trash2 size={16} color={colors.statusReturned} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{editingId ? 'Edit Address' : 'Add New Address'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.fieldLabel}>Label (Home / Office / Other)</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textTertiary}
                placeholder="Home"
                value={form.label}
                onChangeText={(v) => setForm((p) => ({ ...p, label: v }))}
              />
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={[styles.input, { height: 72 }]}
                placeholderTextColor={colors.textTertiary}
                placeholder="House no, street, area"
                value={form.address_line}
                onChangeText={(v) => setForm((p) => ({ ...p, address_line: v }))}
                multiline
              />
              <Text style={styles.fieldLabel}>Landmark (optional)</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textTertiary}
                placeholder="Near park"
                value={form.landmark}
                onChangeText={(v) => setForm((p) => ({ ...p, landmark: v }))}
              />
              <Text style={styles.fieldLabel}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textTertiary}
                placeholder="394210"
                keyboardType="number-pad"
                maxLength={6}
                value={form.pincode}
                onChangeText={(v) => setForm((p) => ({ ...p, pincode: v.replace(/\D/g, '') }))}
              />
              <AppDropdown
                label="State"
                data={stateItems}
                value={stateName}
                placeholder="Select state"
                searchable
                onChange={(val) => {
                  if (val !== stateName) {
                    setStateName(val);
                    setForm((p) => ({ ...p, city_id: '', zone_id: '', area_id: '' }));
                  }
                }}
              />
              <AppDropdown
                label="City"
                data={cityItems}
                value={form.city_id}
                placeholder={stateName ? 'Select city' : 'Select state first'}
                disabled={!stateName}
                searchable
                onChange={(val) =>
                  setForm((p) => ({ ...p, city_id: val, zone_id: '', area_id: '' }))
                }
              />
              <AppDropdown
                label="Zone"
                data={zoneItems}
                value={form.zone_id}
                placeholder={form.city_id ? 'Select zone' : 'Select city first'}
                disabled={!form.city_id}
                onChange={(val) =>
                  setForm((p) => ({ ...p, zone_id: val, area_id: '' }))
                }
              />
              <AppDropdown
                label="Area"
                data={areaItems}
                value={form.area_id}
                placeholder={form.zone_id ? 'Select area' : 'Select zone first'}
                disabled={!form.zone_id}
                onChange={(val) => setForm((p) => ({ ...p, area_id: val }))}
              />
              <View style={{ marginTop: Spacing.xl }}>
                <PrimaryButton
                  label="Save Address"
                  onPress={handleSave}
                  disabled={isSaving}
                  loading={isSaving}
                  height={48}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
