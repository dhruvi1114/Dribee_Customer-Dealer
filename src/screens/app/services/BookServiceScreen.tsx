import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions, Easing, KeyboardAvoidingView,
  Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, X, Check, Plus, SquarePen } from 'lucide-react-native';

import Toast from 'react-native-toast-message';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useServiceCatalogue, useCreateBooking } from '@/services/services/services.query';
import { useAddresses, useCreateAddress } from '@/services/addresses/addresses.query';
import { useStates, useCities, useZones, useAreas } from '@/services/master/master.query';
import { AppDropdown } from '@/components/ui/Dropdown';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useAppSelector } from '@/store/hooks';
import type { CustomerAddress } from '@/types/address';
import type { ServicesStackParamList } from '@/navigation/types';

// Convert "YYYY-MM-DD" + "12:00 PM" → "YYYY-MM-DDTHH:MM:00"
function buildSlotStartTime(date: string, time: string): string {
  const [hm, meridiem] = time.split(' ');
  const [hStr, mStr] = hm.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (meridiem?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${date}T${hh}:${mm}:00`;
}

type Nav = NativeStackNavigationProp<ServicesStackParamList>;
type Route = RouteProp<ServicesStackParamList, 'BookService'>;

interface AddressFormState {
  label: string;
  address_line: string;
  landmark: string;
  pincode: string;
  city_id: string;
  zone_id: string;
  area_id: string;
}
const emptyAddressForm: AddressFormState = {
  label: '', address_line: '', landmark: '', pincode: '',
  city_id: '', zone_id: '', area_id: '',
};

// Valid booking window: 10:00 AM – 9:00 PM.
// AM valid hours: 10, 11 (12 AM = midnight, 1–9 AM are before 10 AM).
// PM valid hours: 12, 1–9 (10 PM, 11 PM exceed 9 PM limit).
const AM_HOURS = [10, 11];
const PM_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const MERIDIEM = ['AM', 'PM'] as const;
const WHEEL_ITEM_H = 44;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BookServiceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { serviceId } = route.params;

  const { data: catalogue, isLoading } = useServiceCatalogue();
  const createBookingMutation = useCreateBooking();
  const user = useAppSelector((s) => s.auth.user);
  const { data: addresses = [] } = useAddresses();
  const createAddressMutation = useCreateAddress();

  const service = useMemo(
    () => catalogue?.find((s) => String(s.id) === serviceId),
    [catalogue, serviceId],
  );

  const today    = useMemo(() => startOfDay(new Date()), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  const validHours = useCallback(
    (meridiem: 'AM' | 'PM') => (meridiem === 'AM' ? AM_HOURS : PM_HOURS),
    [],
  );

  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [selectedDate, setSelectedDate] = useState(format(tomorrow, 'yyyy-MM-dd'));
  const [calendarMonth, setCalendarMonth] = useState(tomorrow);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedMeridiem, setSelectedMeridiem] = useState<'AM' | 'PM'>('AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>(emptyAddressForm);
  const [addressStateName, setAddressStateName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const { data: states = [] } = useStates();
  const { data: allCities = [] } = useCities(addressStateName || undefined);
  const { data: zones = [] } = useZones(addressForm.city_id || undefined);
  const { data: areas = [] } = useAreas(addressForm.zone_id || undefined);

  const addressModalOpacity = useRef(new Animated.Value(0)).current;
  const addressModalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.5)).current;

  const selectedTime = timeConfirmed
    ? `${selectedHour}:${String(selectedMinute).padStart(2, '0')} ${selectedMeridiem}`
    : '';

  const addressDisplayText = selectedAddress
    ? [selectedAddress.address_line, selectedAddress.landmark, selectedAddress.pincode, selectedAddress.area_name, selectedAddress.city_name]
        .filter(Boolean)
        .join(', ')
    : '';

  useEffect(() => {
    if (!showAddressModal) return;
    addressModalOpacity.setValue(0);
    addressModalTranslateY.setValue(SCREEN_HEIGHT * 0.5);
    Animated.parallel([
      Animated.timing(addressModalOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(addressModalTranslateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [showAddressModal, addressModalOpacity, addressModalTranslateY]);

  const handleCloseAddressModal = useCallback(() => {
    addressModalOpacity.setValue(0);
    addressModalTranslateY.setValue(SCREEN_HEIGHT * 0.5);
    setShowAddressModal(false);
    setShowAddForm(false);
    setAddressForm(emptyAddressForm);
    setAddressStateName('');
  }, [addressModalOpacity, addressModalTranslateY]);

  const handleSelectAddress = useCallback((addr: CustomerAddress) => {
    setSelectedAddress(addr);
    handleCloseAddressModal();
  }, [handleCloseAddressModal]);

  const handleSaveNewAddress = useCallback(() => {
    if (!addressForm.address_line.trim()) { Alert.alert('Address line is required'); return; }
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) { Alert.alert('Pincode must be 6 digits'); return; }
    const hasAny = addresses.length > 0;
    createAddressMutation.mutate(
      {
        label: addressForm.label.trim() || undefined,
        address_line: addressForm.address_line.trim(),
        landmark: addressForm.landmark.trim() || undefined,
        pincode: addressForm.pincode.trim(),
        city_id: addressForm.city_id.trim() || undefined,
        zone_id: addressForm.zone_id.trim() || undefined,
        area_id: addressForm.area_id.trim() || undefined,
        ...(!hasAny ? { is_default: true } : {}),
      },
      {
        onSuccess: (saved) => {
          setAddressForm(emptyAddressForm);
          setAddressStateName('');
          setShowAddForm(false);
          handleSelectAddress(saved);
        },
      },
    );
  }, [addressForm, addresses.length, createAddressMutation, handleSelectAddress]);

  const stateItems = states.map((s) => ({ label: s.name, value: s.name }));
  const cityItems = allCities
    .map((c) => ({ label: c.name, value: String(c.id) }));
  const zoneItems = zones.map((z) => ({ label: z.name, value: String(z.id) }));
  const areaItems = areas.map((a) => ({ label: a.name, value: String(a.id) }));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let cursor = calStart;
    while (cursor <= calEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [calendarMonth]);

  const handleConfirm = useCallback(() => {
    if (!service || !selectedAddress) return;
    const zoneId = selectedAddress.zone_id ? Number(selectedAddress.zone_id) : user?.zone_id ? Number(user.zone_id) : null;
    if (!zoneId) {
      Toast.show({ type: 'error', text1: 'Missing zone. Please select an address with a zone.' });
      return;
    }
    const areaId = selectedAddress.area_id ? Number(selectedAddress.area_id) : user?.area_id ? Number(user.area_id) : undefined;
    createBookingMutation.mutate(
      {
        catalogueId: Number(service.id),
        zoneId,
        areaId,
        priority,
        slotDate: selectedDate,
        slotStartTime: buildSlotStartTime(selectedDate, selectedTime),
        customerAddress: addressDisplayText,
        tcAccepted: true,
      },
      {
        onSuccess: () => navigation.navigate('MyBookings'),
      },
    );
  }, [createBookingMutation, service, user, selectedDate, selectedTime, selectedAddress, addressDisplayText, priority, navigation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      margin: Spacing.lg,
      marginBottom: 0,
    },
    cardTitle: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginBottom: Spacing.md },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    infoLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    infoValue: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium, maxWidth: '60%', textAlign: 'right' },
    descriptionText: { fontSize: Typography.fsBody, color: colors.textPrimary, lineHeight: 20, marginTop: 4 },
    priorityRow: { flexDirection: 'row', gap: Spacing.md },
    priorityCard: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      borderWidth: 2,
      alignItems: 'center',
      gap: Spacing.sm,
    },
    priorityName: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold },
    prioritySub: { fontSize: Typography.fsLabel, textAlign: 'center', color: colors.textSecondary },
    datePicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    datePickerText: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium },
    calendarContainer: {
      marginTop: Spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.borderCard,
      overflow: 'hidden',
    },
    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.brandNavy,
    },
    calendarHeaderText: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: '#fff' },
    calendarNavBtn: { padding: Spacing.sm, borderRadius: Radius.sm },
    weekRow: { flexDirection: 'row', paddingHorizontal: 4, paddingTop: Spacing.sm },
    weekDayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: Typography.fwSemibold, color: colors.textTertiary, paddingBottom: Spacing.sm },
    dayGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingBottom: Spacing.sm },
    dayCell: { width: '14.28%', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
    dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    dayText: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium },
    timePicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    timePickerText: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium },
    timePickerPlaceholder: { fontSize: Typography.fsBody, color: colors.textTertiary },
    timeWheelContainer: {
      marginTop: Spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.borderCard,
      overflow: 'hidden',
    },
    timeWheelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.brandNavy,
    },
    timeWheelHeaderText: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: '#fff' },
    timeWheelDoneBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.2)' },
    timeWheelDoneText: { color: '#fff', fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold },
    timeWheelBody: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
    wheelColumn: { flex: 1 },
    wheelColumnNarrow: { width: 70 },
    wheelLabel: { fontSize: 12, fontWeight: Typography.fwSemibold, color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.sm },
    wheelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
    wheelCell: {
      width: WHEEL_ITEM_H,
      height: WHEEL_ITEM_H,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSection,
    },
    wheelCellText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold },
    meridiemColumn: { gap: 6 },
    meridiemCell: {
      height: WHEEL_ITEM_H,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSection,
    },
    addressCard: { backgroundColor: colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, margin: Spacing.lg, marginBottom: 0 },
    addressCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    addressCardTitle: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: colors.textPrimary, flex: 1 },
    addressSelected: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    addressSelectedText: { flex: 1, fontSize: Typography.fsBody, color: colors.textSecondary, lineHeight: 20 },
    addressChangeBtn: { width: 28, height: 28, borderRadius: Radius.sm, borderWidth: 1, borderColor: colors.brandBlue, alignItems: 'center', justifyContent: 'center' },
    addressEmptyText: { fontSize: Typography.fsBody, color: colors.textTertiary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing.md, width: '100%', overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderDivider, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
    modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderDivider },
    modalTitle: { fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary, flex: 1 },
    modalCloseBtn: { padding: 4 },
    addrRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderDivider },
    addrRowSelected: { backgroundColor: colors.brandNavy + '08' },
    addrRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderDivider, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
    addrRadioActive: { borderColor: colors.brandNavy, backgroundColor: colors.brandNavy },
    addrInfo: { flex: 1 },
    addrLabel: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginBottom: 2 },
    addrLine: { fontSize: Typography.fsCaption, color: colors.textSecondary, lineHeight: 18 },
    addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    addNewText: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
    formField: { marginBottom: Spacing.md },
    formLabel: { fontSize: Typography.fsCaption, color: colors.textSecondary, marginBottom: 4, fontWeight: Typography.fwMedium },
    formInput: { height: 44, backgroundColor: colors.bgInput, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, fontSize: Typography.fsInput, color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderDivider },
    formActions: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
    formCancelBtn: { flex: 1, height: 44, borderRadius: Radius.sm, borderWidth: 1, borderColor: colors.borderDivider, justifyContent: 'center', alignItems: 'center' },
    formSaveBtn: { flex: 1, height: 44, borderRadius: Radius.sm, backgroundColor: colors.brandNavy, justifyContent: 'center', alignItems: 'center' },
    summaryCard: { backgroundColor: colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, margin: Spacing.lg, marginBottom: 0, gap: Spacing.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    summaryValue: { fontSize: Typography.fsBody, color: colors.textPrimary },
    summaryDivider: { height: 1, backgroundColor: colors.borderDivider, marginVertical: 4 },
    summaryTotalLabel: { fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: colors.textPrimary },
    summaryTotalValue: { fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: colors.brandNavy },
    tncRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, margin: Spacing.lg, marginTop: Spacing.md },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
    checkmark: { color: '#fff', fontSize: 14, fontWeight: Typography.fwBold },
    tncText: { fontSize: Typography.fsBody, color: colors.textSecondary, flex: 1, lineHeight: 22 },
    tncLink: { color: colors.brandBlue, fontWeight: Typography.fwMedium },
    stickyBar: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 10, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.borderDivider },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Book Service" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Book Service" showBack />
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Service not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const price = priority === 'urgent' ? Math.round((service.base_fee ?? 0) * 1.5) : (service.base_fee ?? 0);
  const gstRate = service.gst_rate ?? 18;
  const gstAmount = Math.round(price * gstRate / 100);
  const totalWithGst = price + gstAmount;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title={`Book: ${service.name}`} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.md }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Summary</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Service</Text><Text style={styles.infoValue}>{service.name}</Text></View>
          {service.service_type_name ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Type</Text><Text style={styles.infoValue}>{service.service_type_name}</Text></View> : null}
          {service.machine_type ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Machine</Text><Text style={styles.infoValue}>{service.machine_type}</Text></View> : null}
          {service.slot_duration_mins ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Duration</Text><Text style={styles.infoValue}>~{service.slot_duration_mins} min</Text></View> : null}
          {service.description ? (
            <View style={{ marginTop: Spacing.sm }}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.descriptionText}>{service.description}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { marginTop: Spacing.md }]}>
          <Text style={styles.cardTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['normal', 'urgent'] as const).map((p) => {
              const selected = priority === p;
              const pPrice = p === 'urgent' ? Math.round((service.base_fee ?? 0) * 1.5) : (service.base_fee ?? 0);
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityCard, { borderColor: selected ? colors.brandNavy : colors.borderCard, backgroundColor: selected ? colors.brandNavy + '10' : 'transparent' }]}
                  onPress={() => setPriority(p)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.priorityName, { color: selected ? colors.brandNavy : colors.textPrimary }]}>{p === 'normal' ? 'Normal' : 'Urgent'}</Text>
                  <Text style={styles.prioritySub}>{p === 'normal' ? 'Standard timeline' : 'Faster response'}</Text>
                  <Text style={{ fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: selected ? colors.brandNavy : colors.brandAmber }}>
                    ₹{pPrice.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { marginTop: Spacing.md }]}>
          <Text style={styles.cardTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowCalendar((p) => !p)}
            activeOpacity={0.85}
          >
            <Text style={styles.datePickerText}>
              {isSameDay(new Date(selectedDate + 'T00:00:00'), today)
                ? `Today, ${format(new Date(selectedDate + 'T00:00:00'), 'dd MMM yyyy')}`
                : format(new Date(selectedDate + 'T00:00:00'), 'EEE, dd MMM yyyy')}
            </Text>
            <CalendarDays size={20} color={colors.brandNavy} strokeWidth={1.5} />
          </TouchableOpacity>

          {showCalendar && (
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.calendarNavBtn}
                  onPress={() => {
                    const prev = addMonths(calendarMonth, -1);
                    if (!isBefore(endOfMonth(prev), today)) setCalendarMonth(prev);
                  }}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.calendarHeaderText}>{format(calendarMonth, 'MMMM yyyy')}</Text>
                <TouchableOpacity
                  style={styles.calendarNavBtn}
                  onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={20} color="#fff" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <Text key={d} style={styles.weekDayLabel}>{d}</Text>
                ))}
              </View>

              <View style={styles.dayGrid}>
                {calendarDays.map((day, idx) => {
                  const inMonth = isSameMonth(day, calendarMonth);
                  const isPast = isBefore(day, tomorrow);
                  const disabled = !inMonth || isPast;
                  const isSelected = isSameDay(day, new Date(selectedDate + 'T00:00:00'));
                  const isToday = isSameDay(day, today);
                  return (
                    <View key={idx} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayCircle,
                          isSelected && { backgroundColor: colors.brandNavy },
                          !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.brandNavy },
                        ]}
                        disabled={disabled}
                        onPress={() => {
                          setSelectedDate(format(day, 'yyyy-MM-dd'));
                          setShowCalendar(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: isSelected ? '#fff' : disabled ? colors.textTertiary : colors.textPrimary },
                          ]}
                        >
                          {inMonth ? format(day, 'd') : ''}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={[styles.cardTitle, { marginTop: Spacing.lg }]}>Select Time</Text>
          <TouchableOpacity
            style={styles.timePicker}
            onPress={() => setShowTimePicker((p) => !p)}
            activeOpacity={0.85}
          >
            {timeConfirmed ? (
              <Text style={styles.timePickerText}>{selectedTime}</Text>
            ) : (
              <Text style={styles.timePickerPlaceholder}>Choose a time slot</Text>
            )}
            <Clock size={20} color={colors.brandNavy} strokeWidth={1.5} />
          </TouchableOpacity>

          {showTimePicker && (
            <View style={styles.timeWheelContainer}>
              <View style={styles.timeWheelHeader}>
                <Text style={styles.timeWheelHeaderText}>Pick Time</Text>
                <TouchableOpacity
                  style={styles.timeWheelDoneBtn}
                  onPress={() => { setTimeConfirmed(true); setShowTimePicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeWheelDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeWheelBody}>
                <View style={styles.wheelColumn}>
                  <Text style={styles.wheelLabel}>Hour</Text>
                  <View style={styles.wheelGrid}>
                    {validHours(selectedMeridiem).map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.wheelCell, h === selectedHour && { backgroundColor: colors.brandNavy }]}
                        onPress={() => setSelectedHour(h)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.wheelCellText, { color: h === selectedHour ? '#fff' : colors.textPrimary }]}>
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.wheelColumn}>
                  <Text style={styles.wheelLabel}>Minute</Text>
                  <View style={styles.wheelGrid}>
                    {MINUTES.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.wheelCell, m === selectedMinute && { backgroundColor: colors.brandNavy }]}
                        onPress={() => setSelectedMinute(m)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.wheelCellText, { color: m === selectedMinute ? '#fff' : colors.textPrimary }]}>
                          {String(m).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.wheelColumnNarrow}>
                  <Text style={styles.wheelLabel}>AM/PM</Text>
                  <View style={styles.meridiemColumn}>
                    {MERIDIEM.map((ap) => (
                      <TouchableOpacity
                        key={ap}
                        style={[styles.meridiemCell, ap === selectedMeridiem && { backgroundColor: colors.brandNavy }]}
                        onPress={() => {
                          setSelectedMeridiem(ap);
                          const hours = ap === 'AM' ? AM_HOURS : PM_HOURS;
                          if (!hours.includes(selectedHour)) setSelectedHour(hours[0]);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.wheelCellText, { color: ap === selectedMeridiem ? '#fff' : colors.textPrimary }]}>
                          {ap}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.addressCard}>
          <View style={styles.addressCardHeader}>
            <MapPin size={18} color={colors.brandNavy} strokeWidth={1.5} />
            <Text style={styles.addressCardTitle}>Service Address</Text>
            <TouchableOpacity
              style={styles.addressChangeBtn}
              onPress={() => setShowAddressModal(true)}
              activeOpacity={0.85}
            >
              {selectedAddress ? (
                <SquarePen size={13} color={colors.brandBlue} strokeWidth={1.8} />
              ) : (
                <Plus size={13} color={colors.brandBlue} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View style={styles.addressSelected}>
              <Text style={styles.addressSelectedText} numberOfLines={3}>
                {selectedAddress.label ? `${selectedAddress.label} · ` : ''}
                {addressDisplayText}
              </Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowAddressModal(true)} activeOpacity={0.85}>
              <Text style={styles.addressEmptyText}>Tap to select or add an address</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Price Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>₹{price.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST ({gstRate}%)</Text>
            <Text style={styles.summaryValue}>₹{gstAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>₹{totalWithGst.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.tncRow} onPress={() => setAgreed((p) => !p)} activeOpacity={0.85}>
          <View style={[styles.checkbox, { borderColor: agreed ? colors.brandNavy : colors.borderInput, backgroundColor: agreed ? colors.brandNavy : 'transparent' }]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.tncText}>
            I agree to the{' '}
            <Text style={styles.tncLink}>Terms and Conditions</Text>
            {' '}of Dribee services.
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.stickyBar}>
        <PrimaryButton
          height={48}
          label={createBookingMutation.isPending ? '' : `Confirm Booking — ₹${totalWithGst.toLocaleString('en-IN')}`}
          onPress={handleConfirm}
          disabled={!agreed || !selectedTime || !selectedAddress || createBookingMutation.isPending}
        />
      </View>

      <Modal visible={showAddressModal} transparent animationType="none" statusBarTranslucent onRequestClose={handleCloseAddressModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseAddressModal} />
          <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View style={[styles.modalSheet, { height: '80%' }, { opacity: addressModalOpacity, transform: [{ translateY: addressModalTranslateY }] }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{showAddForm ? 'Add New Address' : 'Service Address'}</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { if (showAddForm) { setShowAddForm(false); setAddressForm(emptyAddressForm); setAddressStateName(''); } else { handleCloseAddressModal(); } }}>
                    <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Spacing.lg }}>
                  {showAddForm ? (
                    <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Label (Home, Office…)</Text>
                        <TextInput style={styles.formInput} value={addressForm.label} onChangeText={(v) => setAddressForm((p) => ({ ...p, label: v }))} placeholder="e.g. Home" placeholderTextColor={colors.textTertiary} />
                      </View>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Address Line *</Text>
                        <TextInput style={[styles.formInput, { height: 72, paddingTop: Spacing.sm, textAlignVertical: 'top' }]} value={addressForm.address_line} onChangeText={(v) => setAddressForm((p) => ({ ...p, address_line: v }))} placeholder="Flat / Building / Street" placeholderTextColor={colors.textTertiary} multiline />
                      </View>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Landmark</Text>
                        <TextInput style={styles.formInput} value={addressForm.landmark} onChangeText={(v) => setAddressForm((p) => ({ ...p, landmark: v }))} placeholder="Near school / temple…" placeholderTextColor={colors.textTertiary} />
                      </View>
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Pincode *</Text>
                        <TextInput style={styles.formInput} value={addressForm.pincode} onChangeText={(v) => setAddressForm((p) => ({ ...p, pincode: v }))} placeholder="6-digit pincode" placeholderTextColor={colors.textTertiary} keyboardType="numeric" maxLength={6} />
                      </View>

                      <AppDropdown
                        label="State"
                        data={stateItems}
                        value={addressStateName}
                        placeholder="Select state"
                        searchable
                        onChange={(val) => {
                          if (val !== addressStateName) {
                            setAddressStateName(val);
                            setAddressForm((p) => ({ ...p, city_id: '', zone_id: '', area_id: '' }));
                          }
                        }}
                      />
                      <AppDropdown
                        label="City"
                        data={cityItems}
                        value={addressForm.city_id}
                        placeholder={addressStateName ? 'Select city' : 'Select state first'}
                        disabled={!addressStateName}
                        searchable
                        onChange={(val) =>
                          setAddressForm((p) => ({ ...p, city_id: val, zone_id: '', area_id: '' }))
                        }
                      />
                      <AppDropdown
                        label="Zone"
                        data={zoneItems}
                        value={addressForm.zone_id}
                        placeholder={addressForm.city_id ? 'Select zone' : 'Select city first'}
                        disabled={!addressForm.city_id}
                        onChange={(val) =>
                          setAddressForm((p) => ({ ...p, zone_id: val, area_id: '' }))
                        }
                      />
                      <AppDropdown
                        label="Area"
                        data={areaItems}
                        value={addressForm.area_id}
                        placeholder={addressForm.zone_id ? 'Select area' : 'Select zone first'}
                        disabled={!addressForm.zone_id}
                        onChange={(val) => setAddressForm((p) => ({ ...p, area_id: val }))}
                      />

                      <View style={styles.formActions}>
                        <TouchableOpacity style={styles.formCancelBtn} onPress={() => { setShowAddForm(false); setAddressForm(emptyAddressForm); setAddressStateName(''); }}>
                          <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.formSaveBtn} onPress={handleSaveNewAddress} disabled={createAddressMutation.isPending}>
                          {createAddressMutation.isPending ? (
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
                          <Text style={{ fontSize: Typography.fsBody, color: colors.textTertiary, marginBottom: Spacing.md }}>No saved addresses yet</Text>
                        </View>
                      ) : (
                        addresses.map((addr) => {
                          const isSelected = selectedAddress && String(addr.id) === String(selectedAddress.id);
                          return (
                            <TouchableOpacity key={addr.id} style={[styles.addrRow, isSelected && styles.addrRowSelected]} onPress={() => handleSelectAddress(addr)} activeOpacity={0.85}>
                              <View style={[styles.addrRadio, isSelected && styles.addrRadioActive]}>
                                {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                              </View>
                              <View style={styles.addrInfo}>
                                <Text style={styles.addrLabel}>{addr.label ?? 'Address'}{addr.is_default ? '  ·  Default' : ''}</Text>
                                <Text style={styles.addrLine} numberOfLines={2}>
                                  {[addr.address_line, addr.landmark, addr.pincode, addr.area_name, addr.city_name].filter(Boolean).join(', ')}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                      <TouchableOpacity style={styles.addNewBtn} onPress={() => setShowAddForm(true)} activeOpacity={0.85}>
                        <Plus size={18} color={colors.brandBlue} strokeWidth={2} />
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
    </SafeAreaView>
  );
}
