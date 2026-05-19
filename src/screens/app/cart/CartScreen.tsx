import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2, Minus, Plus, Tag, X, MapPin, Check, Plus as PlusIcon, SquarePen, ChevronDown } from 'lucide-react-native';
import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useSetCartCoupon,
  useRemoveCartCoupon,
  useSetCartAddress,
  hasMaterialDiff,
} from '@/services/cart/cart.query';
import { useValidateCoupon } from '@/services/coupons/coupons.query';
import { useAddresses, useCreateAddress } from '@/services/addresses/addresses.query';
import { useAreas, useZones } from '@/services/master/master.query';
import { useCartChangedSheet } from '@/components/cart/CartChangedSheetProvider';
import { resolveWarehouseThunk } from '@/store/slices/locationSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { CustomerAddress } from '@/types/address';
import type { OrdersStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;

interface AddressFormState {
  label: string;
  address_line: string;
  landmark: string;
  pincode: string;
  city_id: string;
  zone_id: string;
  area_id: string;
}
type AddressDropdownType = 'city' | 'zone' | 'area' | null;

const emptyAddressForm: AddressFormState = {
  label: '',
  address_line: '',
  landmark: '',
  pincode: '',
  city_id: '',
  zone_id: '',
  area_id: '',
};
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function CartScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();

  const { data: cart, isLoading } = useCart();
  const location = useAppSelector((s) => s.location);
  const selectedAddressId = useAppSelector((s) => s.location.selectedAddressId);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const setCoupon = useSetCartCoupon();
  const removeCoupon = useRemoveCartCoupon();
  const setCartAddress = useSetCartAddress();
  const cartChangedSheet = useCartChangedSheet();
  const { data: addresses = [] } = useAddresses();
  const createAddress = useCreateAddress();

  const [couponInput, setCouponInput] = useState('');
  const debouncedCoupon = useDebounce(couponInput, 400);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>(emptyAddressForm);
  const [openAddressDropdown, setOpenAddressDropdown] = useState<AddressDropdownType>(null);
  const { data: zones = [] } = useZones();
  const { data: areas = [] } = useAreas(addressForm.zone_id || undefined);
  const addressModalOpacity = useRef(new Animated.Value(0)).current;
  const addressModalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.5)).current;

  const items = cart?.items ?? [];
  const couponCode = cart?.couponCode ?? null;
  const cartWarehouseId = cart?.warehouseId ?? null;
  const cartDeliveryAddress = cart?.deliveryAddress ?? null;
  const subtotal = cart?.subtotal ?? 0;
  const couponDiscount = cart?.couponDiscount ?? 0;
  const total = cart?.total ?? subtotal;
  const lineDiscountTotal = items.reduce((s, it) => s + (it.lineDiscount ?? 0), 0);
  const totalGst = items.reduce((s, it) => s + (it.gstTotal ?? 0), 0);
  const canOrderServer = cart?.canOrder ?? false;
  const warehouseMismatch =
    cartWarehouseId != null &&
    location.warehouseId != null &&
    cartWarehouseId !== location.warehouseId;
  const canCheckout =
    canOrderServer && location.canOrder && !warehouseMismatch && items.length > 0;

  const { data: couponPreview, isFetching: isValidatingCoupon } = useValidateCoupon(
    debouncedCoupon,
    subtotal,
  );

  useEffect(() => {
    if (!showAddressModal) return;
    addressModalOpacity.setValue(0);
    addressModalTranslateY.setValue(SCREEN_HEIGHT * 0.5);
    Animated.parallel([
      Animated.timing(addressModalOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(addressModalTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [showAddressModal, addressModalOpacity, addressModalTranslateY]);

  const handleOpenAddressModal = useCallback(() => {
    setShowAddressModal(true);
  }, []);

  const handleCloseAddressModal = useCallback(() => {
    // Reset animation state before next open to avoid first-frame flicker.
    addressModalOpacity.setValue(0);
    addressModalTranslateY.setValue(SCREEN_HEIGHT * 0.5);
    setShowAddressModal(false);
    setShowAddForm(false);
    setOpenAddressDropdown(null);
    setAddressForm(emptyAddressForm);
  }, [addressModalOpacity, addressModalTranslateY]);

  const applyAddress = useCallback(
    (addr: CustomerAddress) => {
      if (!addr.pincode) return;
      void dispatch(
        resolveWarehouseThunk({
          pincode: addr.pincode,
          source: 'address',
          addressId: addr.id,
          label: addr.label ?? addr.address_line,
        }),
      );
      const numericId = Number(addr.id);
      if (Number.isFinite(numericId)) {
        setCartAddress.mutate(
          { deliveryAddressId: numericId },
          {
            onSuccess: (result) => {
              const previousAddressNumericId = selectedAddressId ? Number(selectedAddressId) : null;
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
      handleCloseAddressModal();
    },
    [dispatch, setCartAddress, selectedAddressId, cartChangedSheet, handleCloseAddressModal],
  );

  const handleUpdateQty = useCallback(
    (variantId: number, delta: number, currentQty: number) => {
      const next = Math.max(1, currentQty + delta);
      if (next === currentQty) return;
      updateItem.mutate({ variantId, qty: next });
    },
    [updateItem],
  );

  const handleRemove = useCallback(
    (variantId: number) => removeItem.mutate(variantId),
    [removeItem],
  );

  const handleApplyCoupon = useCallback(() => {
    if (!couponInput.trim()) return;
    const code = couponInput.trim().toUpperCase();
    setCoupon.mutate({ couponCode: code });
    setCouponInput('');
  }, [couponInput, setCoupon]);

  const handleRemoveCoupon = useCallback(() => removeCoupon.mutate(), [removeCoupon]);

  const handleCheckout = useCallback(() => {
    navigation.navigate('Payment', { amount: total });
  }, [navigation, total]);

  const handleSaveNewAddress = useCallback(() => {
    if (!addressForm.address_line.trim()) {
      Alert.alert('Address line is required');
      return;
    }
    const pincode = addressForm.pincode.trim();
    if (!/^\d{6}$/.test(pincode)) {
      Alert.alert('Pincode must be 6 digits');
      return;
    }
    const hasAny = addresses.length > 0;
    const payload = {
      label: addressForm.label.trim() || undefined,
      address_line: addressForm.address_line.trim(),
      landmark: addressForm.landmark.trim() || undefined,
      pincode,
      city_id: addressForm.city_id.trim() || undefined,
      zone_id: addressForm.zone_id.trim() || undefined,
      area_id: addressForm.area_id.trim() || undefined,
      ...(!hasAny ? { is_default: true } : {}),
    };
    createAddress.mutate(payload, {
      onSuccess: (saved) => {
        setAddressForm(emptyAddressForm);
        setShowAddForm(false);
        setOpenAddressDropdown(null);
        applyAddress(saved);
      },
    });
  }, [addressForm, addresses.length, createAddress, applyAddress]);

  const cityOptions = Array.from(
    new Map(
      zones
        .filter((z) => z.city_id != null && z.city_name)
        .map((z) => [String(z.city_id), { id: String(z.city_id), name: z.city_name ?? '' }]),
    ).values(),
  );
  const zoneOptions = zones
    .filter((z) => !addressForm.city_id || String(z.city_id) === addressForm.city_id)
    .map((z) => ({ id: String(z.id), name: z.name }));
  const areaOptions = areas.map((a) => ({ id: String(a.id), name: a.name }));
  const selectedCityName = cityOptions.find((c) => c.id === addressForm.city_id)?.name ?? '';
  const selectedZoneName = zoneOptions.find((z) => z.id === addressForm.zone_id)?.name ?? '';
  const selectedAreaName = areaOptions.find((a) => a.id === addressForm.area_id)?.name ?? '';

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    itemCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      gap: Spacing.md,
    },
    itemCardUnavailable: {
      opacity: 0.6,
      borderWidth: 1,
      borderColor: colors.statusReturned + '60',
    },
    unavailableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: 4,
    },
    unavailableText: {
      flex: 1,
      fontSize: 11,
      color: colors.statusReturned,
      fontWeight: Typography.fwMedium,
    },
    unavailableRemove: {
      fontSize: 11,
      color: colors.statusReturned,
      fontWeight: Typography.fwBold,
      textDecorationLine: 'underline',
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbText: { fontSize: 18, fontWeight: Typography.fwBold, color: colors.brandNavy, opacity: 0.5 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: Typography.fsProduct, fontWeight: Typography.fwMedium, color: colors.textPrimary },
    itemPrice: { fontSize: Typography.fsScreen, fontWeight: Typography.fwBold, color: colors.brandNavy },
    deleteBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    qtyText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
    couponCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    couponRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    couponInput: {
      flex: 1,
      height: 44,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
    },
    applyBtn: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.sm,
      backgroundColor: colors.brandBlue,
    },
    applyBtnText: { fontSize: Typography.fsBody, color: '#fff', fontWeight: Typography.fwMedium },
    appliedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: colors.statusDelivered + '20',
      marginTop: Spacing.sm,
    },
    appliedText: { fontSize: Typography.fsBody, color: colors.statusDelivered, fontWeight: Typography.fwMedium },
    // Address card
    addressCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    addressCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    addressCardTitle: {
      fontSize: Typography.fsProduct,
      fontWeight: Typography.fwSemibold,
      color: colors.textPrimary,
      flex: 1,
    },
    addressSelected: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    addressSelectedText: {
      flex: 1,
      fontSize: Typography.fsBody,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    addressEmptyState: {
      minHeight: 20,
    },
    addressChangeBtn: {
      width: 28,
      height: 28,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.brandBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Summary
    summaryCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    summaryValue: { fontSize: Typography.fsBody, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.borderDivider },
    totalLabel: { fontSize: Typography.fsScreen, fontWeight: Typography.fwBold, color: colors.textPrimary },
    totalValue: { fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.brandNavy },
    stickyBar: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: 10,
      backgroundColor: colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: colors.borderDivider,
    },
    // Address modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingBottom: Spacing.md,
      width: '100%',
      overflow: 'hidden',
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderDivider,
      alignSelf: 'center',
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
    },
    modalTitle: { fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary, flex: 1 },
    modalCloseBtn: { padding: 4 },
    addrRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
    },
    addrRowSelected: { backgroundColor: colors.brandNavy + '08' },
    addrRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.borderDivider,
      marginTop: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addrRadioActive: { borderColor: colors.brandNavy, backgroundColor: colors.brandNavy },
    addrInfo: { flex: 1 },
    addrLabel: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginBottom: 2 },
    addrLine: { fontSize: Typography.fsCaption, color: colors.textSecondary, lineHeight: 18 },
    addNewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    addNewText: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
    // Add form
    formField: { marginBottom: Spacing.md },
    formLabel: { fontSize: Typography.fsCaption, color: colors.textSecondary, marginBottom: 4, fontWeight: Typography.fwMedium },
    formInput: {
      height: 44,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderDivider,
    },
    selectField: {
      height: 44,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: colors.borderDivider,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
    },
    selectFieldText: { fontSize: Typography.fsInput, color: colors.textPrimary },
    selectFieldPlaceholder: { fontSize: Typography.fsInput, color: colors.textTertiary },
    dropdownMenu: {
      marginTop: 6,
      borderWidth: 1,
      borderColor: colors.borderDivider,
      borderRadius: Radius.sm,
      backgroundColor: colors.bgCard,
      overflow: 'hidden',
      maxHeight: 170,
    },
    dropdownOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
    },
    dropdownOptionActive: {
      backgroundColor: colors.brandNavy + '10',
    },
    dropdownOptionText: { fontSize: Typography.fsBody, color: colors.textPrimary },
    dropdownEmptyText: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.fsBody,
      color: colors.textTertiary,
    },
    formActions: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
    formCancelBtn: {
      flex: 1,
      height: 44,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.borderDivider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    formSaveBtn: {
      flex: 1,
      height: 44,
      borderRadius: Radius.sm,
      backgroundColor: colors.brandNavy,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const addressDisplayText = cartDeliveryAddress
    ? [
        cartDeliveryAddress.addressLine,
        cartDeliveryAddress.pincode,
        cartDeliveryAddress.warehouseName,
      ]
        .filter(Boolean)
        .join(', ')
    : null;
  const hasSelectedAddress = Boolean(addressDisplayText);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title={`My Cart (${items.length})`} showBack />
      {isLoading && !cart ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandNavy} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState title="Your cart is empty" subtitle="Browse products and add them to your cart" actionLabel="Browse Products" onAction={() => navigation.goBack()} />
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: Spacing.lg }}
          >
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.variantId)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.itemCard, !item.isAvailable && styles.itemCardUnavailable]}>
                  <View style={styles.thumb}>
                    {item.image ? (
                      <FastImage
                        source={{ uri: item.image }}
                        style={{ width: 72, height: 72, borderRadius: Radius.sm }}
                        resizeMode={FastImage.resizeMode.contain}
                      />
                    ) : (
                      <Text style={styles.thumbText}>{item.displayName.slice(0, 2).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }} numberOfLines={1}>{item.displayName}</Text>
                    <Text style={styles.itemPrice}>₹{Math.round(item.lineTotal).toLocaleString('en-IN')}</Text>
                    {item.gstRate != null && (
                      <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 1 }}>
                        Incl. GST {item.gstRate}% (₹{Math.round(item.gstTotal ?? 0).toLocaleString('en-IN')})
                      </Text>
                    )}
                    {item.lineDiscount > 0 && item.appliedSlab ? (
                      <Text style={{ fontSize: 11, color: colors.statusDelivered, marginTop: 2 }}>
                        Saved ₹{Math.round(item.lineDiscount).toLocaleString('en-IN')} · {item.appliedSlab.discountPercent}% off at {item.appliedSlab.minQty}+ units
                      </Text>
                    ) : item.appliedSlab?.nudgeMessage ? (
                      <Text style={{ fontSize: 11, color: colors.brandAmber, marginTop: 2 }}>
                        {item.appliedSlab.nudgeMessage}
                      </Text>
                    ) : null}
                    {!item.isAvailable ? (
                      <View style={styles.unavailableRow}>
                        <Text style={styles.unavailableText}>
                          Not available at this delivery address
                        </Text>
                        <TouchableOpacity onPress={() => handleRemove(item.variantId)} activeOpacity={0.7}>
                          <Text style={styles.unavailableRemove}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : !item.inStock ? (
                      <Text style={{ fontSize: 11, color: colors.statusReturned, marginTop: 2 }}>
                        Out of stock
                      </Text>
                    ) : null}
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.variantId, -1, item.qty)} activeOpacity={0.85}>
                        <Minus size={14} color={colors.textPrimary} strokeWidth={2} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.variantId, 1, item.qty)} activeOpacity={0.85}>
                        <Plus size={14} color={colors.textPrimary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemove(item.variantId)} activeOpacity={0.85}>
                    <Trash2 size={18} color={colors.statusReturned} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Coupon */}
            <View style={styles.couponCard}>
              <View style={styles.couponRow}>
                <Tag size={18} color={colors.textSecondary} strokeWidth={1.5} />
                <TextInput
                  style={styles.couponInput}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon} activeOpacity={0.85}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {couponCode ? (
                <TouchableOpacity style={styles.appliedChip} onPress={handleRemoveCoupon} activeOpacity={0.85}>
                  <Text style={styles.appliedText}>{couponCode} applied</Text>
                  <X size={14} color={colors.statusDelivered} strokeWidth={2} />
                </TouchableOpacity>
              ) : !couponCode && debouncedCoupon.trim().length >= 3 && !isValidatingCoupon && couponPreview ? (
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 6,
                    color: couponPreview.valid ? colors.statusDelivered : colors.statusReturned,
                  }}
                >
                  {couponPreview.valid
                    ? `✓ Valid · saves ₹${(couponPreview.discount ?? 0).toLocaleString('en-IN')}`
                    : (couponPreview.message ?? 'Invalid coupon code')}
                </Text>
              ) : null}
            </View>

            {/* Delivery Address */}
            <View style={styles.addressCard}>
              <View style={styles.addressCardHeader}>
                <MapPin size={18} color={colors.brandNavy} strokeWidth={1.5} />
                <Text style={styles.addressCardTitle}>Delivery Address</Text>
                <TouchableOpacity
                  style={styles.addressChangeBtn}
                  onPress={handleOpenAddressModal}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={hasSelectedAddress ? 'Change delivery address' : 'Add delivery address'}
                  accessibilityHint="Opens saved addresses to select or add a new one"
                >
                  {hasSelectedAddress ? (
                    <SquarePen size={13} color={colors.brandBlue} strokeWidth={1.8} />
                  ) : (
                    <Plus size={13} color={colors.brandBlue} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
              {addressDisplayText ? (
                <View style={styles.addressSelected}>
                  <Text style={styles.addressSelectedText} numberOfLines={3}>
                    {cartDeliveryAddress?.label ? `${cartDeliveryAddress.label} · ` : ''}
                    {addressDisplayText}
                  </Text>
                </View>
              ) : (
                <View style={styles.addressEmptyState} />
              )}
            </View>

            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal (excl. GST)</Text>
                <Text style={styles.summaryValue}>
                  ₹{Math.round(subtotal - totalGst + lineDiscountTotal).toLocaleString('en-IN')}
                </Text>
              </View>
              {lineDiscountTotal > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.statusDelivered }]}>Volume savings</Text>
                  <Text style={[styles.summaryValue, { color: colors.statusDelivered }]}>
                    −₹{Math.round(lineDiscountTotal).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              {totalGst > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST</Text>
                  <Text style={styles.summaryValue}>₹{Math.round(totalGst).toLocaleString('en-IN')}</Text>
                </View>
              )}
              {couponDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.statusDelivered }]}>
                    Coupon ({couponCode})
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.statusDelivered }]}>
                    −₹{Math.round(couponDiscount).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total (incl. GST)</Text>
                <Text style={styles.totalValue}>₹{Math.round(total).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.stickyBar}>
            {warehouseMismatch ? (
              <View style={{ paddingBottom: Spacing.sm }}>
                <Text style={{ fontSize: 12, color: '#B45309' }}>
                  Your location changed. Some items were added from a different warehouse — please review.
                </Text>
              </View>
            ) : null}
            {!canOrderServer ? (
              <View style={{ paddingBottom: Spacing.sm }}>
                <Text style={{ fontSize: 12, color: '#B45309' }}>
                  Cart contains items that can&apos;t be delivered. Update your address to check out.
                </Text>
              </View>
            ) : null}
            <PrimaryButton
              height={48}
              label={
                !canOrderServer || !location.canOrder
                  ? 'Not available in your area'
                  : warehouseMismatch
                    ? 'Review cart before checkout'
                    : `Proceed to Payment — ₹${Math.round(total).toLocaleString('en-IN')}`
              }
              onPress={handleCheckout}
              disabled={!canCheckout}
            />
          </View>

          {/* Address picker / add modal */}
          <Modal
            visible={showAddressModal}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleCloseAddressModal}
          >
            <View style={styles.modalOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseAddressModal} />
              <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <Animated.View
                  style={[
                    styles.modalSheet,
                    { height: '80%' },
                    {
                      opacity: addressModalOpacity,
                      transform: [{ translateY: addressModalTranslateY }],
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        {showAddForm ? 'Add New Address' : 'Delivery Address'}
                      </Text>
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => {
                          if (showAddForm) {
                            setShowAddForm(false);
                            setAddressForm(emptyAddressForm);
                          } else {
                            handleCloseAddressModal();
                          }
                        }}
                      >
                        <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      style={{ flex: 1 }}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingBottom: Spacing.lg }}
                    >
                      {showAddForm ? (
                        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Label (Home, Office…)</Text>
                            <TextInput
                              style={styles.formInput}
                              value={addressForm.label}
                              onChangeText={(v) => setAddressForm((p) => ({ ...p, label: v }))}
                              placeholder="e.g. Home"
                              placeholderTextColor={colors.textTertiary}
                            />
                          </View>
                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Address Line *</Text>
                            <TextInput
                              style={[styles.formInput, { height: 72, paddingTop: Spacing.sm, textAlignVertical: 'top' }]}
                              value={addressForm.address_line}
                              onChangeText={(v) => setAddressForm((p) => ({ ...p, address_line: v }))}
                              placeholder="Flat / Building / Street"
                              placeholderTextColor={colors.textTertiary}
                              multiline
                            />
                          </View>
                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Landmark</Text>
                            <TextInput
                              style={styles.formInput}
                              value={addressForm.landmark}
                              onChangeText={(v) => setAddressForm((p) => ({ ...p, landmark: v }))}
                              placeholder="Near school / temple…"
                              placeholderTextColor={colors.textTertiary}
                            />
                          </View>
                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Pincode *</Text>
                            <TextInput
                              style={styles.formInput}
                              value={addressForm.pincode}
                              onChangeText={(v) => setAddressForm((p) => ({ ...p, pincode: v }))}
                              placeholder="6-digit pincode"
                              placeholderTextColor={colors.textTertiary}
                              keyboardType="numeric"
                              maxLength={6}
                            />
                          </View>
                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>City</Text>
                            <TouchableOpacity
                              style={styles.selectField}
                              onPress={() =>
                                setOpenAddressDropdown((p) => (p === 'city' ? null : 'city'))
                              }
                              activeOpacity={0.85}
                            >
                              <Text style={selectedCityName ? styles.selectFieldText : styles.selectFieldPlaceholder}>
                                {selectedCityName || 'Select city'}
                              </Text>
                              <ChevronDown size={16} color={colors.textTertiary} strokeWidth={1.6} />
                            </TouchableOpacity>
                            {openAddressDropdown === 'city' && (
                              <ScrollView nestedScrollEnabled style={styles.dropdownMenu}>
                                {cityOptions.length === 0 ? (
                                  <Text style={styles.dropdownEmptyText}>No city found</Text>
                                ) : (
                                  cityOptions.map((item, index) => (
                                    <TouchableOpacity
                                      key={item.id}
                                      style={[
                                        styles.dropdownOption,
                                        item.id === addressForm.city_id && styles.dropdownOptionActive,
                                        index === cityOptions.length - 1 ? { borderBottomWidth: 0 } : null,
                                      ]}
                                      onPress={() => {
                                        setAddressForm((p) => ({
                                          ...p,
                                          city_id: item.id,
                                          zone_id: '',
                                          area_id: '',
                                        }));
                                        setOpenAddressDropdown(null);
                                      }}
                                      activeOpacity={0.85}
                                    >
                                      <Text style={styles.dropdownOptionText}>{item.name}</Text>
                                    </TouchableOpacity>
                                  ))
                                )}
                              </ScrollView>
                            )}
                          </View>
                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Zone</Text>
                            <TouchableOpacity
                              style={styles.selectField}
                              onPress={() =>
                                setOpenAddressDropdown((p) => (p === 'zone' ? null : 'zone'))
                              }
                              activeOpacity={0.85}
                            >
                              <Text style={selectedZoneName ? styles.selectFieldText : styles.selectFieldPlaceholder}>
                                {selectedZoneName || 'Select zone'}
                              </Text>
                              <ChevronDown size={16} color={colors.textTertiary} strokeWidth={1.6} />
                            </TouchableOpacity>
                            {openAddressDropdown === 'zone' && (
                              <ScrollView nestedScrollEnabled style={styles.dropdownMenu}>
                                {zoneOptions.length === 0 ? (
                                  <Text style={styles.dropdownEmptyText}>No zone found</Text>
                                ) : (
                                  zoneOptions.map((item, index) => (
                                    <TouchableOpacity
                                      key={item.id}
                                      style={[
                                        styles.dropdownOption,
                                        item.id === addressForm.zone_id && styles.dropdownOptionActive,
                                        index === zoneOptions.length - 1 ? { borderBottomWidth: 0 } : null,
                                      ]}
                                      onPress={() => {
                                        setAddressForm((p) => ({
                                          ...p,
                                          zone_id: item.id,
                                          area_id: '',
                                        }));
                                        setOpenAddressDropdown(null);
                                      }}
                                      activeOpacity={0.85}
                                    >
                                      <Text style={styles.dropdownOptionText}>{item.name}</Text>
                                    </TouchableOpacity>
                                  ))
                                )}
                              </ScrollView>
                            )}
                          </View>
                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Area</Text>
                            <TouchableOpacity
                              style={styles.selectField}
                              onPress={() =>
                                setOpenAddressDropdown((p) => (p === 'area' ? null : 'area'))
                              }
                              activeOpacity={0.85}
                            >
                              <Text style={selectedAreaName ? styles.selectFieldText : styles.selectFieldPlaceholder}>
                                {selectedAreaName || 'Select area'}
                              </Text>
                              <ChevronDown size={16} color={colors.textTertiary} strokeWidth={1.6} />
                            </TouchableOpacity>
                            {openAddressDropdown === 'area' && (
                              <ScrollView nestedScrollEnabled style={styles.dropdownMenu}>
                                {areaOptions.length === 0 ? (
                                  <Text style={styles.dropdownEmptyText}>No area found</Text>
                                ) : (
                                  areaOptions.map((item, index) => (
                                    <TouchableOpacity
                                      key={item.id}
                                      style={[
                                        styles.dropdownOption,
                                        item.id === addressForm.area_id && styles.dropdownOptionActive,
                                        index === areaOptions.length - 1 ? { borderBottomWidth: 0 } : null,
                                      ]}
                                      onPress={() => {
                                        setAddressForm((p) => ({ ...p, area_id: item.id }));
                                        setOpenAddressDropdown(null);
                                      }}
                                      activeOpacity={0.85}
                                    >
                                      <Text style={styles.dropdownOptionText}>{item.name}</Text>
                                    </TouchableOpacity>
                                  ))
                                )}
                              </ScrollView>
                            )}
                          </View>
                          <View style={styles.formActions}>
                            <TouchableOpacity
                              style={styles.formCancelBtn}
                              onPress={() => {
                                setShowAddForm(false);
                                setAddressForm(emptyAddressForm);
                              }}
                            >
                              <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.formSaveBtn}
                              onPress={handleSaveNewAddress}
                              disabled={createAddress.isPending}
                            >
                              {createAddress.isPending ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={{ fontSize: Typography.fsBody, color: '#fff', fontWeight: Typography.fwSemibold }}>Save & Select</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          {addresses.length === 0 ? (
                            <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                              <Text style={{ fontSize: Typography.fsBody, color: colors.textTertiary, marginBottom: Spacing.md }}>
                                No saved addresses yet
                              </Text>
                            </View>
                          ) : (
                            addresses.map((addr) => {
                              const isSelected = String(addr.id) === String(cartDeliveryAddress?.id ?? '');
                              return (
                                <TouchableOpacity
                                  key={addr.id}
                                  style={[styles.addrRow, isSelected && styles.addrRowSelected]}
                                  onPress={() => applyAddress(addr)}
                                  activeOpacity={0.85}
                                >
                                  <View style={[styles.addrRadio, isSelected && styles.addrRadioActive]}>
                                    {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                                  </View>
                                  <View style={styles.addrInfo}>
                                    <Text style={styles.addrLabel}>
                                      {addr.label ?? 'Address'}
                                      {addr.is_default ? '  ·  Default' : ''}
                                    </Text>
                                    <Text style={styles.addrLine} numberOfLines={2}>
                                      {[addr.address_line, addr.landmark, addr.pincode, addr.area_name, addr.city_name]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })
                          )}
                          <TouchableOpacity
                            style={styles.addNewBtn}
                            onPress={() => setShowAddForm(true)}
                            activeOpacity={0.85}
                          >
                            <PlusIcon size={18} color={colors.brandBlue} strokeWidth={2} />
                            <Text style={styles.addNewText}>Add New Address</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </ScrollView>
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}
