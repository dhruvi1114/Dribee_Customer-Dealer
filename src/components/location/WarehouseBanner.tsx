import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapPin, Truck } from 'lucide-react-native';

import { LightColors } from '@/constants/colors';
import { useLocationSheet } from '@/components/location/LocationSheetProvider';
import { useAddresses } from '@/services/addresses/addresses.query';
import { useOrderSettings } from '@/services/master/master.query';
import { useAppSelector } from '@/store/hooks';

interface Props {
  onPress?: () => void;
}

// Shows the resolved warehouse with distance + delivery charge info.
// Tapping opens the LocationSetupSheet unless an explicit onPress is provided.
export function WarehouseBanner({ onPress }: Props) {
  const warehouseName = useAppSelector((s) => s.location.warehouseName);
  const canOrder = useAppSelector((s) => s.location.canOrder);
  const resolveStatus = useAppSelector((s) => s.location.resolveStatus);
  const pincode = useAppSelector((s) => s.location.pincode);
  const addressLabel = useAppSelector((s) => s.location.deliveryAddressLabel);
  const selectedAddressId = useAppSelector((s) => s.location.selectedAddressId);
  const distanceKm = useAppSelector((s) => s.location.distanceKm);
  const { open } = useLocationSheet();
  const { data: addresses = [] } = useAddresses();
  const handlePress = onPress ?? open;

  const { data: orderSettings } = useOrderSettings();
  const freeWithinKm = orderSettings?.freeDeliveryWithinKm ?? 90;
  const chargeAmount = orderSettings?.deliveryChargeAmount ?? 0;

  const selectedAddress = addresses.find((a) => String(a.id) === String(selectedAddressId));
  const fullAddressLine = selectedAddress
    ? [selectedAddress.address_line, selectedAddress.pincode].filter(Boolean).join(' · ')
    : null;

  const deliverToLine = addressLabel ?? (pincode ? `Pincode ${pincode}` : 'Tap to set delivery address');

  const deliveryChargeLine = (() => {
    if (distanceKm === null) return null;
    if (distanceKm <= freeWithinKm) return 'Free delivery';
    return `+₹${chargeAmount} delivery (${Math.round(distanceKm)} km away)`;
  })();

  if (resolveStatus === 'idle' || resolveStatus === 'resolving') {
    return (
      <View style={[styles.banner, styles.loading]}>
        <MapPin size={14} color={LightColors.textTertiary} strokeWidth={1.5} />
        <Text style={styles.loadingText}>Finding your nearest warehouse…</Text>
      </View>
    );
  }

  if (!warehouseName && !canOrder) {
    return (
      <TouchableOpacity style={[styles.banner, styles.noLocation]} onPress={handlePress} activeOpacity={0.8}>
        <MapPin size={14} color={LightColors.textTertiary} strokeWidth={1.5} />
        <View style={styles.textColumn}>
          <Text style={styles.noLocationLabel}>Set your delivery location</Text>
          <Text style={styles.noLocationSub}>Tap to pick your delivery address</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.banner, styles.delivery]} onPress={handlePress} activeOpacity={0.8}>
      <MapPin size={14} color={LightColors.brandNavy} strokeWidth={1.5} />
      <View style={styles.textColumn}>
        <Text style={styles.deliveryLabel}>
          Deliver to · <Text style={styles.deliveryLabelBold}>{deliverToLine}</Text>
        </Text>
        {fullAddressLine ? (
          <Text style={styles.fullAddress} numberOfLines={2}>{fullAddressLine}</Text>
        ) : null}
        <View style={styles.bottomRow}>
          <Text style={styles.deliveryText} numberOfLines={1}>
            {warehouseName ?? 'your warehouse'}
          </Text>
          {deliveryChargeLine ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Truck size={10} color={deliveryChargeLine === 'Free delivery' ? '#16A34A' : '#B45309'} strokeWidth={1.5} />
              <Text style={[styles.chargeText, deliveryChargeLine === 'Free delivery' ? styles.freeCharge : styles.paidCharge]}>
                {deliveryChargeLine}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  loading: { backgroundColor: LightColors.bgSection },
  loadingText: { fontSize: 12, color: LightColors.textTertiary },
  textColumn: { flex: 1 },
  delivery: { backgroundColor: '#EEF2FF' },
  deliveryLabel: { fontSize: 11, color: LightColors.textTertiary },
  deliveryLabelBold: { color: LightColors.brandNavy, fontWeight: '600' },
  fullAddress: { fontSize: 11, color: LightColors.textSecondary, marginTop: 1 },
  deliveryText: { fontSize: 11, color: LightColors.textTertiary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  dot: { fontSize: 10, color: LightColors.textTertiary },
  chargeText: { fontSize: 10, fontWeight: '500' },
  freeCharge: { color: '#16A34A' },
  paidCharge: { color: '#B45309' },
  noLocation: { backgroundColor: LightColors.bgSection },
  noLocationLabel: { fontSize: 12, color: LightColors.textSecondary, fontWeight: '500' },
  noLocationSub: { fontSize: 11, color: LightColors.textTertiary, marginTop: 1 },
});
