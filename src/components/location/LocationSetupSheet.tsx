import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Home, MapPin, Search } from 'lucide-react-native';

import { useCartChangedSheet } from '@/components/cart/CartChangedSheetProvider';
import { LightColors } from '@/constants/colors';
import { getCurrentCoordinates, requestLocationPermission } from '@/lib/geolocation';
import { logger } from '@/lib/logger';
import { useAddresses } from '@/services/addresses/addresses.query';
import { hasMaterialDiff, useSetCartAddress } from '@/services/cart/cart.query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  resolveWarehouseThunk,
  setCoords,
  setPermissionStatus,
  setPincode,
} from '@/store/slices/locationSlice';
import type { CustomerAddress } from '@/types/address';

export interface LocationSetupSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  onHandleReady?: (handle: LocationSetupSheetHandle) => void;
}

// Delivery-address picker. Options:
//   1. Pick from saved addresses (preferred — drives both location + cart)
//   2. Use current location (GPS) as a one-off
//   3. Enter pincode manually as a one-off
// The chosen option sets the deliveryAddressSource so GPS movement will not
// silently override an explicit choice.
export function LocationSetupSheet({ onHandleReady }: Props) {
  const dispatch = useAppDispatch();
  const resolveStatus = useAppSelector((s) => s.location.resolveStatus);
  const selectedAddressId = useAppSelector((s) => s.location.selectedAddressId);
  const { data: addresses = [] } = useAddresses();
  const setCartAddress = useSetCartAddress();
  const cartChangedSheet = useCartChangedSheet();
  const ref = useRef<BottomSheetModal>(null);
  const [pincodeInput, setPincodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const snapPoints = useMemo(() => ['75%'], []);

  const handle = useMemo<LocationSetupSheetHandle>(
    () => ({
      present: () => ref.current?.present(),
      dismiss: () => ref.current?.dismiss(),
    }),
    [],
  );

  if (onHandleReady) onHandleReady(handle);

  const useCurrentLocation = useCallback(async () => {
    setError(null);
    try {
      const permission = await requestLocationPermission();
      dispatch(setPermissionStatus(permission));
      if (permission !== 'granted') {
        setError('Location permission not granted. Try pincode instead.');
        return;
      }
      const coords = await getCurrentCoordinates();
      dispatch(setCoords(coords));
      await dispatch(
        resolveWarehouseThunk({
          lat: coords.lat,
          lng: coords.lng,
          source: 'gps',
          label: 'Current location',
        }),
      );
      ref.current?.dismiss();
    } catch (err) {
      logger.warn('[AddressPicker] GPS failed', err);
      setError('Could not get your location. Try pincode instead.');
    }
  }, [dispatch]);

  const submitPincode = useCallback(async () => {
    const trimmed = pincodeInput.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Enter a valid 6-digit pincode');
      return;
    }
    setError(null);
    dispatch(setPincode(trimmed));
    await dispatch(
      resolveWarehouseThunk({
        pincode: trimmed,
        source: 'manual',
        label: `Pincode ${trimmed}`,
      }),
    );
    ref.current?.dismiss();
  }, [dispatch, pincodeInput]);

  const pickSavedAddress = useCallback(
    async (addr: CustomerAddress) => {
      if (!addr.pincode) {
        setError('This address has no pincode. Edit it to add one.');
        return;
      }
      setError(null);
      await dispatch(
        resolveWarehouseThunk({
          pincode: addr.pincode,
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
      ref.current?.dismiss();
    },
    [dispatch, setCartAddress, selectedAddressId, cartChangedSheet],
  );

  const isResolving = resolveStatus === 'resolving';

  return (
    <BottomSheetModal ref={ref} snapPoints={snapPoints} enablePanDownToClose>
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Where should we deliver?</Text>
        <Text style={styles.subtitle}>
          Prices and availability will update based on the address you choose.
        </Text>

        {addresses.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Saved addresses</Text>
            <ScrollView style={styles.addressList} contentContainerStyle={styles.addressListContent} keyboardShouldPersistTaps="handled">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                      isResolving && styles.optionDisabled,
                    ]}
                    onPress={() => pickSavedAddress(addr)}
                    disabled={isResolving}
                    activeOpacity={0.85}
                  >
                    <Home size={20} color={LightColors.brandNavy} strokeWidth={1.5} />
                    <View style={styles.optionBody}>
                      <Text style={styles.optionTitle} numberOfLines={1}>
                        {addr.label ?? 'Address'}
                        {addr.is_default ? '  · Default' : ''}
                      </Text>
                      <Text style={styles.optionHint} numberOfLines={2}>
                        {addr.address_line}
                        {addr.pincode ? ` · ${addr.pincode}` : ' · No pincode'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.orText}>Or use a one-off location</Text>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.option, isResolving && styles.optionDisabled]}
          onPress={useCurrentLocation}
          disabled={isResolving}
          activeOpacity={0.85}
        >
          <MapPin size={20} color={LightColors.brandNavy} strokeWidth={1.5} />
          <View style={styles.optionBody}>
            <Text style={styles.optionTitle}>Use my current location</Text>
            <Text style={styles.optionHint}>We'll pick the nearest warehouse.</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.orText}>Or enter pincode</Text>
        <View style={styles.pincodeRow}>
          <Search size={16} color={LightColors.textTertiary} strokeWidth={1.5} />
          <TextInput
            value={pincodeInput}
            onChangeText={setPincodeInput}
            placeholder="6-digit pincode"
            placeholderTextColor={LightColors.textTertiary}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, isResolving && styles.optionDisabled]}
          onPress={submitPincode}
          disabled={isResolving}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {isResolving ? 'Checking…' : 'Continue with pincode'}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: LightColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: LightColors.textTertiary,
    textAlign: 'center',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: LightColors.bgSection,
  },
  optionDisabled: { opacity: 0.55 },
  optionSelected: {
    borderWidth: 1.5,
    borderColor: LightColors.brandNavy,
    backgroundColor: '#EEF2FF',
  },
  optionBody: { flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LightColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  addressList: { maxHeight: 200 },
  addressListContent: { gap: 8 },
  optionTitle: { fontSize: 14, fontWeight: '600', color: LightColors.textPrimary },
  optionHint: { fontSize: 12, color: LightColors.textTertiary, marginTop: 1 },
  orText: {
    textAlign: 'center',
    color: LightColors.textTertiary,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  pincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: LightColors.borderDivider,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: LightColors.textPrimary,
  },
  errorText: { color: '#EF4444', fontSize: 12 },
  primaryBtn: {
    backgroundColor: LightColors.brandAmber,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
