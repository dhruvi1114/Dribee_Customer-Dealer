import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Phone, Check, X, Star, ChevronLeft, ChevronRight, CalendarDays, Clock, RefreshCw } from 'lucide-react-native';
import { addDays, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, isSameMonth, isSameDay, isBefore, format, parseISO } from 'date-fns';
import Toast from 'react-native-toast-message';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useBooking, useBookingInvoice, useCancelBooking, useApproveParts, usePlacePartsOrder, useRequestRevisit, useReassignBookingPro, useResumeBooking, useRateJob } from '@/services/services/services.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ServicesStackParamList>;
type Route = RouteProp<ServicesStackParamList, 'BookingDetail'>;

const WHEEL_ITEM_H = 44;

const STATUS_BG: Record<string, string> = {
  pending_assignment: '#F59E0B',
  assigned: '#2563EB',
  confirmed: '#2563EB',
  enroute: '#7C3AED',
  in_progress: '#7C3AED',
  parts_pending: '#EA580C',
  completed: '#16A34A',
  cancelled: '#6B7280',
};

export function BookingDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { bookingId } = route.params;

  const { data: booking, isLoading } = useBooking(bookingId);
  // Invoice is generated when the pro completes the job. We pull it lazily —
  // the request returns 404 until completion, so the hook is gated on status.
  const { data: invoice } = useBookingInvoice(bookingId, {
    enabled: booking?.status === 'completed' || booking?.status === 'cancelled',
  });
  const cancelMutation = useCancelBooking();
  const approvePartsMutation = useApproveParts();
  const placeOrderMutation = usePlacePartsOrder();
  const revisitMutation = useRequestRevisit();
  const reassignMutation = useReassignBookingPro();
  const resumeMutation = useResumeBooking();

  // ── Resume slot picker (Phase 3) ──────────────────────────────────────
  // Shown when booking is paused on parts. Customer picks a date+time and
  // hits Resume → POST /bookings/:id/resume.
  const today = startOfDay(new Date());
  const [resumeDate, setResumeDate] = useState<string>(format(today, 'yyyy-MM-dd'));
  const [resumeCalendarMonth, setResumeCalendarMonth] = useState(today);
  const [showResumeCalendar, setShowResumeCalendar] = useState(false);
  const [resumeHour, setResumeHour] = useState('');
  const [resumeMinute, setResumeMinute] = useState('');
  const [resumeMeridiem, setResumeMeridiem] = useState('');
  const [showResumeTimePicker, setShowResumeTimePicker] = useState(false);
  const [resumeTimeConfirmed, setResumeTimeConfirmed] = useState(false);
  const [revisitDate, setRevisitDate] = useState<string>(format(today, 'yyyy-MM-dd'));
  const [revisitCalendarMonth, setRevisitCalendarMonth] = useState(today);
  const [showRevisitCalendar, setShowRevisitCalendar] = useState(false);
  const [revisitHour, setRevisitHour] = useState('');
  const [revisitMinute, setRevisitMinute] = useState('');
  const [revisitMeridiem, setRevisitMeridiem] = useState('');
  const [showRevisitTimePicker, setShowRevisitTimePicker] = useState(false);
  const [revisitTimeConfirmed, setRevisitTimeConfirmed] = useState(false);

  const resumeCalendarDays = useMemo(() => {
    const monthStart = startOfMonth(resumeCalendarMonth);
    const monthEnd = endOfMonth(resumeCalendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let cursor = calStart;
    while (cursor <= calEnd) { days.push(cursor); cursor = addDays(cursor, 1); }
    return days;
  }, [resumeCalendarMonth]);

  const resumeSelectedTime = resumeTimeConfirmed && resumeHour && resumeMinute && resumeMeridiem
    ? `${resumeHour}:${resumeMinute} ${resumeMeridiem}` : '';

  const HOURS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const MINUTES = ['00','15','30','45'];
  const MERIDIEM = ['AM','PM'];

  const revisitCalendarDays = useMemo(() => {
    const monthStart = startOfMonth(revisitCalendarMonth);
    const monthEnd = endOfMonth(revisitCalendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let cursor = calStart;
    while (cursor <= calEnd) { days.push(cursor); cursor = addDays(cursor, 1); }
    return days;
  }, [revisitCalendarMonth]);

  const revisitSelectedTime = revisitTimeConfirmed && revisitHour && revisitMinute && revisitMeridiem
    ? `${revisitHour}:${revisitMinute} ${revisitMeridiem}` : '';
  const isPausedOnParts =
    booking?.status === 'awaiting_parts' ||
    booking?.status === 'parts_ready' ||
    booking?.status === 'parts_pending' ||
    booking?.status === 'ready_to_resume';
  const handleResumeBooking = useCallback(() => {
    if (!resumeDate || !resumeSelectedTime) {
      Toast.show({ type: 'error', text1: 'Pick a date and time first' });
      return;
    }
    let h = parseInt(resumeHour, 10);
    const m = resumeMinute;
    if (resumeMeridiem === 'PM' && h !== 12) h += 12;
    if (resumeMeridiem === 'AM' && h === 12) h = 0;
    const slotTime = `${String(h).padStart(2, '0')}:${m}`;
    resumeMutation.mutate({ bookingId, slot_date: resumeDate, slot_start_time: slotTime });
  }, [bookingId, resumeDate, resumeSelectedTime, resumeHour, resumeMinute, resumeMeridiem, resumeMutation]);

  const [showCancelDrawer, setShowCancelDrawer] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRejectPartsConfirm, setShowRejectPartsConfirm] = useState(false);
  const [showSubmitPartsConfirm, setShowSubmitPartsConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const cancelDrawerAnim = useRef(new Animated.Value(0)).current;

  const openCancelDrawer = useCallback(() => {
    setShowCancelDrawer(true);
    Animated.timing(cancelDrawerAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [cancelDrawerAnim]);

  const closeCancelDrawer = useCallback(() => {
    Animated.timing(cancelDrawerAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setShowCancelDrawer(false);
      setCancelReason('');
      setShowCancelConfirm(false);
    });
  }, [cancelDrawerAnim]);
  // Per-part approve/reject toggle. Default: every part starts selected
  // (approved). Customer un-checks parts they don't want, then Submits.
  const [partSelection, setPartSelection] = useState<Record<string, boolean>>({});

  const [showRatingDrawer, setShowRatingDrawer] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const rateJobMutation = useRateJob();
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const openRatingDrawer = useCallback(() => {
    setShowRatingDrawer(true);
    Animated.timing(drawerAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [drawerAnim]);

  const closeRatingDrawer = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setShowRatingDrawer(false);
      setRatingValue(0);
      setRatingFeedback('');
    });
  }, [drawerAnim]);

  const serviceJobId = booking?.service_job_id ?? booking?.jobId ?? null;

  const handleCancelConfirm = useCallback(() => {
    if (!cancelReason.trim()) return;
    cancelMutation.mutate(
      { id: bookingId, data: { reason: cancelReason } },
      { onSuccess: () => closeCancelDrawer() },
    );
    setShowCancelConfirm(false);
  }, [cancelMutation, bookingId, cancelReason, closeCancelDrawer]);

  const togglePart = useCallback((partId: string) => {
    setPartSelection((prev) => ({ ...prev, [partId]: !(prev[partId] ?? true) }));
  }, []);

  const handleSubmitPartsDecision = useCallback(() => {
    setShowSubmitPartsConfirm(true);
  }, []);

  const handleConfirmSubmitParts = useCallback(() => {
    if (!booking?.parts || !serviceJobId) return;
    const approvedPartIds: string[] = [];
    const rejectedPartIds: string[] = [];
    for (const p of booking.parts) {
      const id = String((p as unknown as { id: unknown }).id);
      if (partSelection[id] ?? true) approvedPartIds.push(id);
      else rejectedPartIds.push(id);
    }
    approvePartsMutation.mutate(
      { jobId: serviceJobId, data: { approvedPartIds, rejectedPartIds } },
      { onSuccess: () => setShowSubmitPartsConfirm(false) },
    );
  }, [approvePartsMutation, booking, partSelection, serviceJobId]);

  const handleRejectAllParts = useCallback(() => {
    setShowRejectPartsConfirm(true);
  }, []);

  const handleConfirmRejectAllParts = useCallback(() => {
    if (!booking?.parts || !serviceJobId) return;
    const rejectedPartIds = booking.parts.map((p) => String((p as unknown as { id: unknown }).id));
    approvePartsMutation.mutate(
      { jobId: serviceJobId, data: { approvedPartIds: [], rejectedPartIds } },
      { onSuccess: () => setShowRejectPartsConfirm(false) },
    );
  }, [approvePartsMutation, booking, serviceJobId]);

  const handlePlaceOrder = useCallback(() => {
    if (!serviceJobId) return;
    // No payment at order time. Booking flips to awaiting_parts on the backend
    // and the customer sees only the "Order placed" badge until parts arrive
    // and the resume → install → final-bill flow runs.
    placeOrderMutation.mutate({ jobId: serviceJobId });
  }, [placeOrderMutation, serviceJobId]);

  const handleRequestRevisit = useCallback(() => {
    if (!revisitDate || !revisitSelectedTime) {
      Toast.show({ type: 'error', text1: 'Pick a date and time for your revisit' });
      return;
    }
    let h = parseInt(revisitHour, 10);
    const m = revisitMinute;
    if (revisitMeridiem === 'PM' && h !== 12) h += 12;
    if (revisitMeridiem === 'AM' && h === 12) h = 0;
    const slotTime = `${String(h).padStart(2, '0')}:${m}`;
    revisitMutation.mutate(
      { bookingId, data: { slot_date: revisitDate, slot_start_time: slotTime } },
      {
        onSuccess: (res) => {
          // Hop to the new continuation booking so the user lands on the right
          // record. Replace so the original parent stays one back-press away.
          navigation.replace('BookingDetail', { bookingId: res.revisit_booking_id });
        },
      },
    );
  }, [revisitMutation, bookingId, navigation, revisitDate, revisitSelectedTime, revisitHour, revisitMinute, revisitMeridiem]);

  const handlePayment = useCallback((owed?: number) => {
    navigation.navigate('Payment', { bookingId, amount: owed ?? booking?.total ?? 0 });
  }, [navigation, bookingId, booking]);

  const handleRatePro = useCallback(() => openRatingDrawer(), [openRatingDrawer]);

  const handleSubmitRating = useCallback(() => {
    const jobId = booking?.service_job_id ?? booking?.jobId;
    if (!jobId || ratingValue === 0) return;
    rateJobMutation.mutate(
      { jobId, data: { rating: ratingValue, comment: ratingFeedback.trim() || undefined } },
      { onSuccess: () => closeRatingDrawer() },
    );
  }, [rateJobMutation, booking, ratingValue, ratingFeedback, closeRatingDrawer]);

  const handleViewInvoice = useCallback(() => {
    navigation.navigate('ServiceInvoice', { bookingId });
  }, [navigation, bookingId]);

  const handleShowOtp = useCallback(() => {
    navigation.navigate('OtpGeneration', { bookingId });
  }, [navigation, bookingId]);

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
    cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    cardTitle: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.pill },
    statusBadgeText: { fontSize: 11, fontWeight: Typography.fwSemibold, textTransform: 'uppercase', letterSpacing: 0.5 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    infoLabel: { fontSize: Typography.fsBody, color: colors.textSecondary },
    infoValue: { fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium },
    proRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    proAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgSection, justifyContent: 'center', alignItems: 'center' },
    proAvatarText: { fontSize: 14, fontWeight: Typography.fwBold, color: colors.brandNavy },
    proName: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    proPhone: { fontSize: Typography.fsBody, color: colors.textSecondary },
    callIcon: {
      padding: Spacing.sm,
    },
    otpNote: { fontSize: Typography.fsLabel, color: colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
    cancelBtn: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.statusReturned,
      alignItems: 'center',
    },
    cancelBtnText: { fontSize: Typography.fsBody, color: colors.statusReturned, fontWeight: Typography.fwMedium },
    cancelInput: {
      height: 52,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
    },
    cancelActionRow: { flexDirection: 'row', gap: Spacing.md, marginHorizontal: Spacing.lg, marginTop: Spacing.sm },
    rvDatePicker: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.bgInput, borderRadius: Radius.md, borderWidth: 1.5,
      borderColor: colors.borderInput, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    rvCalendarContainer: { marginTop: Spacing.md, backgroundColor: colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.borderCard, overflow: 'hidden' },
    rvCalendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: colors.brandNavy },
    rvCalendarHeaderText: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: '#fff' },
    rvCalendarNavBtn: { padding: Spacing.sm, borderRadius: Radius.sm },
    rvWeekRow: { flexDirection: 'row', paddingHorizontal: 4, paddingTop: Spacing.sm },
    rvWeekDayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: Typography.fwSemibold, color: colors.textTertiary, paddingBottom: Spacing.sm },
    rvDayGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingBottom: Spacing.sm },
    rvDayCell: { width: '14.28%', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
    rvDayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    rvDayText: { fontSize: Typography.fsBody, fontWeight: Typography.fwMedium },
    rvTimePicker: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.bgInput, borderRadius: Radius.md, borderWidth: 1.5,
      borderColor: colors.borderInput, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    rvTimeWheelContainer: { marginTop: Spacing.md, backgroundColor: colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.borderCard, overflow: 'hidden' },
    rvTimeWheelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: colors.brandNavy },
    rvTimeWheelHeaderText: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: '#fff' },
    rvTimeWheelDoneBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.2)' },
    rvTimeWheelDoneText: { color: '#fff', fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold },
    rvTimeWheelBody: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
    rvWheelColumn: { flex: 1 },
    rvWheelColumnNarrow: { width: 70 },
    rvWheelLabel: { fontSize: 12, fontWeight: Typography.fwSemibold, color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.sm },
    rvWheelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
    rvWheelCell: { width: WHEEL_ITEM_H, height: WHEEL_ITEM_H, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSection },
    rvWheelCellText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold },
    rvMeridiemColumn: { gap: 6 },
    rvMeridiemCell: { height: WHEEL_ITEM_H, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSection },
  });

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Booking Details" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  const dateText = (() => {
    try { return format(parseISO(booking.scheduledDate), 'dd MMM yyyy'); } catch { return booking.scheduledDate; }
  })();

  const canShowOtp = ['assigned', 'confirmed', 'enroute'].includes(booking.status);

  const addressText = (() => {
    const a = booking.address as unknown;
    if (typeof a === 'string') return a;
    if (a && typeof a === 'object') {
      const { street, city, pincode } = a as { street?: string; city?: string; pincode?: string };
      return [street, city, pincode].filter(Boolean).join(', ');
    }
    return '';
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={booking.bookingId} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Service Info</Text>
            <View style={[styles.statusBadge, { backgroundColor: (STATUS_BG[booking.status] ?? '#6B7280') + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: STATUS_BG[booking.status] ?? '#6B7280' }]}>
                {booking.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Service</Text><Text style={styles.infoValue}>{booking.serviceName}</Text></View>
          {booking.serviceTypeName ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Type</Text><Text style={styles.infoValue}>{booking.serviceTypeName}</Text></View> : null}
          {booking.machineType ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Machine</Text><Text style={styles.infoValue}>{booking.machineType}</Text></View> : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Priority</Text>
            <Text style={[styles.infoValue, booking.priority === 'urgent' && { color: '#F59E0B' }]}>
              {booking.priority === 'urgent' ? 'Urgent' : 'Normal'}
            </Text>
          </View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{dateText}</Text></View>
          {booking.timeSlot ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Time</Text><Text style={styles.infoValue}>{booking.timeSlot}</Text></View> : null}
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Address</Text><Text style={styles.infoValue} numberOfLines={2}>{addressText}</Text></View>
        </View>

        {booking.pro && (
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <Text style={styles.cardTitle}>Service Professional</Text>
            <View style={styles.proRow}>
              <View style={styles.proAvatar}>
                <Text style={styles.proAvatarText}>{booking.pro.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proName}>{booking.pro.name}</Text>
                <Text style={styles.proPhone}>{booking.pro.phone}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                {booking.continuation_visit && ['confirmed', 'assigned', 'enroute'].includes(booking.status) && (
                  <TouchableOpacity
                    onPress={() => reassignMutation.mutate(bookingId)}
                    disabled={reassignMutation.isPending}
                    activeOpacity={0.7}
                    style={{ opacity: reassignMutation.isPending ? 0.5 : 1 }}
                  >
                    <RefreshCw size={20} color={colors.statusReturned} strokeWidth={1.5} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${booking.pro!.phone}`)}
                  style={styles.callIcon}
                  activeOpacity={0.7}
                >
                  <Phone size={20} color={colors.brandTeal} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {canShowOtp && (
          <View style={{ marginHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <View style={{ flex: 2 }}>
                <PrimaryButton height={48} label="Show OTP for Technician" onPress={handleShowOtp} />
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { marginHorizontal: 0, marginTop: 0, height: 48, justifyContent: 'center' }]}
                  onPress={openCancelDrawer}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.otpNote}>Generate the OTP when the Pro arrives at your location.</Text>
          </View>
        )}

        {booking.parts && booking.parts.length > 0 && (
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            {(() => {
              const isPending = booking.parts_list_status === 'sent';
              const isLocked = booking.parts_list_status === 'locked';
              let approvedSubtotal = 0;
              let approvedGst = 0;
              let allPartsSubtotal = 0;
              let allPartsGst = 0;
              const rendered = booking.parts.map((part) => {
                const p = part as unknown as Record<string, unknown>;
                const id = String(p.id);
                const name = (p.name as string | undefined) ?? (p.product_name as string | undefined) ?? (p.sku_name as string | undefined) ?? 'Part';
                const qty = Number(p.qty ?? 0);
                const price = Number(p.price ?? p.unit_price ?? 0);
                const gstRate = Number(p.gst_rate ?? 0);
                const lineTotal = price * Math.max(qty, 1);
                const lineGst = (lineTotal * gstRate) / 100;
                const availabilityStatus = p.availability_status as string | undefined;
                const isUnavailable = availabilityStatus === 'unavailable';
                const available = (p.available as boolean | undefined) ?? availabilityStatus !== 'out_of_stock';
                const customerApproved = Boolean(p.customer_approved);
                const selected = isPending ? (partSelection[id] ?? true) : customerApproved;
                if (!isUnavailable) {
                  allPartsSubtotal += lineTotal;
                  allPartsGst += lineGst;
                }
                if (selected && !isUnavailable) {
                  approvedSubtotal += lineTotal;
                  approvedGst += lineGst;
                }
                return (
                  <View key={id} style={[styles.infoRow, { alignItems: 'center' }]}>
                    {isPending ? (
                      <TouchableOpacity
                        onPress={() => togglePart(id)}
                        style={{
                          width: 22, height: 22, borderRadius: 4, borderWidth: 1.5,
                          borderColor: selected ? colors.brandTeal : colors.borderInput,
                          backgroundColor: selected ? colors.brandTeal : 'transparent',
                          alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
                        }}
                      >
                        {selected ? <Check size={14} color="#fff" strokeWidth={2} /> : null}
                      </TouchableOpacity>
                    ) : (
                      <View style={{ width: 22, height: 22, marginRight: Spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
                        {customerApproved
                          ? <Check size={16} color={colors.statusDelivered} strokeWidth={2} />
                          : <X size={16} color={colors.statusReturned} strokeWidth={2} />}
                      </View>
                    )}
                    <Text
                      style={[
                        styles.infoLabel,
                        { flex: 1 },
                        isUnavailable && { textDecorationLine: 'line-through', color: colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {name} × {qty}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <Text
                        style={[
                          styles.infoValue,
                          isUnavailable && { textDecorationLine: 'line-through', color: colors.textTertiary },
                        ]}
                      >
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </Text>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: (isUnavailable ? colors.statusReturned : (available ? colors.statusDelivered : colors.statusReturned)) + '20' }}>
                        <Text style={{ fontSize: 10, color: isUnavailable ? colors.statusReturned : (available ? colors.statusDelivered : colors.statusReturned), fontWeight: Typography.fwSemibold }}>
                          {isUnavailable ? 'Unavailable' : (available ? 'In Stock' : 'Out of Stock')}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              });
              const allRejected = isLocked && approvedSubtotal === 0;
              return (
                <>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>Parts List</Text>
                    {allRejected ? (
                      <View style={[styles.statusBadge, { backgroundColor: colors.statusReturned + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: colors.statusReturned }]}>Rejected</Text>
                      </View>
                    ) : booking.parts_order_id ? (
                      <View style={[styles.statusBadge, { backgroundColor: colors.statusDelivered + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: colors.statusDelivered }]}>Order Placed</Text>
                      </View>
                    ) : null}
                  </View>
                  {rendered}
                  <View style={{ marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderDivider, paddingTop: Spacing.sm }}>
                    {(() => {
                      const sub = allRejected ? allPartsSubtotal : approvedSubtotal;
                      const gst = allRejected ? allPartsGst : approvedGst;
                      return (
                        <>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Subtotal</Text>
                            <Text style={styles.infoValue}>₹{sub.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>GST</Text>
                            <Text style={styles.infoValue}>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                          </View>
                          <View style={[styles.infoRow, { marginTop: 4 }]}>
                            <Text style={[styles.infoLabel, { fontWeight: Typography.fwSemibold }]}>
                              {allRejected ? 'Total (Rejected)' : isLocked ? 'Approved Total' : 'Approving Total'}
                            </Text>
                            <Text style={[styles.infoValue, { fontWeight: Typography.fwBold, textDecorationLine: allRejected ? 'line-through' : 'none' }]}>
                              ₹{(sub + gst).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                  {isPending && (
                    <View style={{ marginTop: Spacing.md, flexDirection: 'row', gap: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <PrimaryButton
                          height={48}
                          label={approvePartsMutation.isPending ? '' : 'Submit'}
                          onPress={handleSubmitPartsDecision}
                          disabled={approvePartsMutation.isPending}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={handleRejectAllParts}
                        disabled={approvePartsMutation.isPending}
                        style={{
                          flex: 1,
                          height: 48,
                          justifyContent: 'center',
                          borderRadius: Radius.md,
                          borderWidth: 1.5,
                          borderColor: colors.statusReturned,
                          alignItems: 'center',
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={{ color: colors.statusReturned, fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold }}>
                          Reject All
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {isLocked && !booking.parts_order_id && approvedSubtotal > 0 && (
                    <View style={{ marginTop: Spacing.md }}>
                      <PrimaryButton
                        height={48}
                        label={placeOrderMutation.isPending ? '' : `Place Order — ₹${(approvedSubtotal + approvedGst).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        onPress={handlePlaceOrder}
                        disabled={placeOrderMutation.isPending}
                      />
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        )}

        {isPausedOnParts && (
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <Text style={styles.cardTitle}>Resume Service</Text>
            <Text style={[styles.infoLabel, { marginBottom: Spacing.md }]}>
              Your parts have arrived. Pick a slot and we&apos;ll notify the pro to come back and install.
            </Text>

            <Text style={[styles.cardTitle, { marginBottom: Spacing.sm }]}>Select Date</Text>
            <TouchableOpacity
              style={styles.rvDatePicker}
              onPress={() => setShowResumeCalendar((p) => !p)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium }}>
                {isSameDay(new Date(resumeDate + 'T00:00:00'), today)
                  ? `Today, ${format(new Date(resumeDate + 'T00:00:00'), 'dd MMM yyyy')}`
                  : format(new Date(resumeDate + 'T00:00:00'), 'EEE, dd MMM yyyy')}
              </Text>
              <CalendarDays size={20} color={colors.brandNavy} strokeWidth={1.5} />
            </TouchableOpacity>

            {showResumeCalendar && (
              <View style={styles.rvCalendarContainer}>
                <View style={styles.rvCalendarHeader}>
                  <TouchableOpacity
                    style={styles.rvCalendarNavBtn}
                    onPress={() => {
                      const prev = addMonths(resumeCalendarMonth, -1);
                      if (!isBefore(endOfMonth(prev), today)) setResumeCalendarMonth(prev);
                    }}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={20} color="#fff" strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={styles.rvCalendarHeaderText}>{format(resumeCalendarMonth, 'MMMM yyyy')}</Text>
                  <TouchableOpacity
                    style={styles.rvCalendarNavBtn}
                    onPress={() => setResumeCalendarMonth(addMonths(resumeCalendarMonth, 1))}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={20} color="#fff" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.rvWeekRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <Text key={d} style={styles.rvWeekDayLabel}>{d}</Text>
                  ))}
                </View>

                <View style={styles.rvDayGrid}>
                  {resumeCalendarDays.map((day, idx) => {
                    const inMonth = isSameMonth(day, resumeCalendarMonth);
                    const isPast = isBefore(day, today);
                    const disabled = !inMonth || isPast;
                    const isSelected = isSameDay(day, new Date(resumeDate + 'T00:00:00'));
                    const isToday = isSameDay(day, today);
                    return (
                      <View key={idx} style={styles.rvDayCell}>
                        <TouchableOpacity
                          style={[
                            styles.rvDayCircle,
                            isSelected && { backgroundColor: colors.brandNavy },
                            !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.brandNavy },
                          ]}
                          disabled={disabled}
                          onPress={() => { setResumeDate(format(day, 'yyyy-MM-dd')); setShowResumeCalendar(false); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvDayText, { color: isSelected ? '#fff' : disabled ? colors.textTertiary : colors.textPrimary }]}>
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
              style={styles.rvTimePicker}
              onPress={() => setShowResumeTimePicker((p) => !p)}
              activeOpacity={0.85}
            >
              {resumeTimeConfirmed ? (
                <Text style={{ fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium }}>{resumeSelectedTime}</Text>
              ) : (
                <Text style={{ fontSize: Typography.fsBody, color: colors.textTertiary }}>Choose a time slot</Text>
              )}
              <Clock size={20} color={colors.brandNavy} strokeWidth={1.5} />
            </TouchableOpacity>

            {showResumeTimePicker && (
              <View style={styles.rvTimeWheelContainer}>
                <View style={styles.rvTimeWheelHeader}>
                  <Text style={styles.rvTimeWheelHeaderText}>Pick Time</Text>
                  <TouchableOpacity
                    style={styles.rvTimeWheelDoneBtn}
                    onPress={() => { setResumeTimeConfirmed(true); setShowResumeTimePicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rvTimeWheelDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.rvTimeWheelBody}>
                  <View style={styles.rvWheelColumn}>
                    <Text style={styles.rvWheelLabel}>Hour</Text>
                    <View style={styles.rvWheelGrid}>
                      {HOURS.map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[styles.rvWheelCell, h === resumeHour && { backgroundColor: colors.brandNavy }]}
                          onPress={() => setResumeHour(h)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvWheelCellText, { color: h === resumeHour ? '#fff' : colors.textPrimary }]}>{h}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.rvWheelColumn}>
                    <Text style={styles.rvWheelLabel}>Minute</Text>
                    <View style={styles.rvWheelGrid}>
                      {MINUTES.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.rvWheelCell, m === resumeMinute && { backgroundColor: colors.brandNavy }]}
                          onPress={() => setResumeMinute(m)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvWheelCellText, { color: m === resumeMinute ? '#fff' : colors.textPrimary }]}>{String(m).padStart(2, '0')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.rvWheelColumnNarrow}>
                    <Text style={styles.rvWheelLabel}>AM/PM</Text>
                    <View style={styles.rvMeridiemColumn}>
                      {MERIDIEM.map((ap) => (
                        <TouchableOpacity
                          key={ap}
                          style={[styles.rvMeridiemCell, ap === resumeMeridiem && { backgroundColor: colors.brandNavy }]}
                          onPress={() => setResumeMeridiem(ap)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvWheelCellText, { color: ap === resumeMeridiem ? '#fff' : colors.textPrimary }]}>{ap}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={{ marginTop: Spacing.lg, flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  height={48}
                  label={resumeMutation.isPending ? '' : 'Resume Service'}
                  onPress={handleResumeBooking}
                  disabled={resumeMutation.isPending || !resumeSelectedTime}
                />
              </View>
              <TouchableOpacity
                onPress={openCancelDrawer}
                style={{
                  flex: 1,
                  height: 48,
                  justifyContent: 'center',
                  borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderColor: colors.statusReturned,
                  alignItems: 'center',
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: colors.statusReturned, fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Revisit is for true post-completion follow-ups (new repair on the
            same machine). The in-flight install case is handled by the Resume
            Service card above. So only show after the job is fully complete. */}

        {booking.status === 'completed' && booking.rating == null && (
          <View style={[styles.card, { marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center' }]}>
            <Star size={24} color="#FBBF24" fill="#FBBF24" strokeWidth={1.5} />
            <Text style={{ flex: 1, fontSize: Typography.fsBody, fontWeight: Typography.fwMedium, color: colors.textPrimary, marginLeft: Spacing.md }}>
              Rate your service provider?
            </Text>
            <TouchableOpacity
              onPress={handleRatePro}
              activeOpacity={0.85}
              style={{ backgroundColor: colors.brandAmber, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.sm }}
            >
              <Text style={{ fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' }}>Rate now</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'completed' && (
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <Text style={styles.cardTitle}>Need More Help?</Text>
            <Text style={[styles.infoLabel, { marginBottom: Spacing.md }]}>
              If the issue isn&apos;t fully resolved or new symptoms have appeared, book a follow-up visit.
            </Text>

            <Text style={[styles.cardTitle, { marginBottom: Spacing.sm }]}>Select Date</Text>
            <TouchableOpacity
              style={styles.rvDatePicker}
              onPress={() => setShowRevisitCalendar((p) => !p)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium }}>
                {isSameDay(new Date(revisitDate + 'T00:00:00'), today)
                  ? `Today, ${format(new Date(revisitDate + 'T00:00:00'), 'dd MMM yyyy')}`
                  : format(new Date(revisitDate + 'T00:00:00'), 'EEE, dd MMM yyyy')}
              </Text>
              <CalendarDays size={20} color={colors.brandNavy} strokeWidth={1.5} />
            </TouchableOpacity>

            {showRevisitCalendar && (
              <View style={styles.rvCalendarContainer}>
                <View style={styles.rvCalendarHeader}>
                  <TouchableOpacity
                    style={styles.rvCalendarNavBtn}
                    onPress={() => {
                      const prev = addMonths(revisitCalendarMonth, -1);
                      if (!isBefore(endOfMonth(prev), today)) setRevisitCalendarMonth(prev);
                    }}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={20} color="#fff" strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={styles.rvCalendarHeaderText}>{format(revisitCalendarMonth, 'MMMM yyyy')}</Text>
                  <TouchableOpacity
                    style={styles.rvCalendarNavBtn}
                    onPress={() => setRevisitCalendarMonth(addMonths(revisitCalendarMonth, 1))}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={20} color="#fff" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.rvWeekRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <Text key={d} style={styles.rvWeekDayLabel}>{d}</Text>
                  ))}
                </View>

                <View style={styles.rvDayGrid}>
                  {revisitCalendarDays.map((day, idx) => {
                    const inMonth = isSameMonth(day, revisitCalendarMonth);
                    const isPast = isBefore(day, today);
                    const disabled = !inMonth || isPast;
                    const isSelected = isSameDay(day, new Date(revisitDate + 'T00:00:00'));
                    const isToday = isSameDay(day, today);
                    return (
                      <View key={idx} style={styles.rvDayCell}>
                        <TouchableOpacity
                          style={[
                            styles.rvDayCircle,
                            isSelected && { backgroundColor: colors.brandNavy },
                            !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.brandNavy },
                          ]}
                          disabled={disabled}
                          onPress={() => { setRevisitDate(format(day, 'yyyy-MM-dd')); setShowRevisitCalendar(false); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvDayText, { color: isSelected ? '#fff' : disabled ? colors.textTertiary : colors.textPrimary }]}>
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
              style={styles.rvTimePicker}
              onPress={() => setShowRevisitTimePicker((p) => !p)}
              activeOpacity={0.85}
            >
              {revisitTimeConfirmed ? (
                <Text style={{ fontSize: Typography.fsBody, color: colors.textPrimary, fontWeight: Typography.fwMedium }}>{revisitSelectedTime}</Text>
              ) : (
                <Text style={{ fontSize: Typography.fsBody, color: colors.textTertiary }}>Choose a time slot</Text>
              )}
              <Clock size={20} color={colors.brandNavy} strokeWidth={1.5} />
            </TouchableOpacity>

            {showRevisitTimePicker && (
              <View style={styles.rvTimeWheelContainer}>
                <View style={styles.rvTimeWheelHeader}>
                  <Text style={styles.rvTimeWheelHeaderText}>Pick Time</Text>
                  <TouchableOpacity
                    style={styles.rvTimeWheelDoneBtn}
                    onPress={() => { setRevisitTimeConfirmed(true); setShowRevisitTimePicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rvTimeWheelDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.rvTimeWheelBody}>
                  <View style={styles.rvWheelColumn}>
                    <Text style={styles.rvWheelLabel}>Hour</Text>
                    <View style={styles.rvWheelGrid}>
                      {HOURS.map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[styles.rvWheelCell, h === revisitHour && { backgroundColor: colors.brandNavy }]}
                          onPress={() => setRevisitHour(h)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvWheelCellText, { color: h === revisitHour ? '#fff' : colors.textPrimary }]}>{h}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.rvWheelColumn}>
                    <Text style={styles.rvWheelLabel}>Minute</Text>
                    <View style={styles.rvWheelGrid}>
                      {MINUTES.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.rvWheelCell, m === revisitMinute && { backgroundColor: colors.brandNavy }]}
                          onPress={() => setRevisitMinute(m)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvWheelCellText, { color: m === revisitMinute ? '#fff' : colors.textPrimary }]}>{String(m).padStart(2, '0')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.rvWheelColumnNarrow}>
                    <Text style={styles.rvWheelLabel}>AM/PM</Text>
                    <View style={styles.rvMeridiemColumn}>
                      {MERIDIEM.map((ap) => (
                        <TouchableOpacity
                          key={ap}
                          style={[styles.rvMeridiemCell, ap === revisitMeridiem && { backgroundColor: colors.brandNavy }]}
                          onPress={() => setRevisitMeridiem(ap)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.rvWheelCellText, { color: ap === revisitMeridiem ? '#fff' : colors.textPrimary }]}>{ap}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={{ marginTop: Spacing.lg }}>
              <PrimaryButton
                height={48}
                label={revisitMutation.isPending ? '' : 'Book a Revisit'}
                onPress={handleRequestRevisit}
                disabled={revisitMutation.isPending || !revisitSelectedTime}
              />
            </View>
          </View>
        )}

        {/* Invoice breakdown — shown once the pro completes the job. Renders
            every line item the bill is composed of so the customer can see
            exactly what they're paying for before tapping Pay. */}
        {(booking.status === 'completed' || booking.status === 'cancelled') && invoice && (
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={styles.cardTitle}>Invoice {invoice.invoice_number}</Text>
              <TouchableOpacity onPress={handleViewInvoice} activeOpacity={0.85}>
                <Text style={{ color: colors.brandTeal, fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold }}>View</Text>
              </TouchableOpacity>
            </View>
            {(invoice.line_items ?? []).map((li, i) => {
              const item = li as unknown as { description?: string; qty?: number; unit_price?: number; amount?: number; gst_rate?: number; gst_amount?: number };
              const desc = item.description ?? 'Item';
              const qty = Number(item.qty ?? 1);
              const lineAmount = Number(item.amount ?? 0);
              const lineGst = Number(item.gst_amount ?? 0);
              const lineTotal = lineAmount + lineGst;
              return (
                <View key={i} style={[styles.infoRow, { paddingVertical: 6 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel} numberOfLines={1}>{desc}</Text>
                    <Text style={[styles.infoLabel, { fontSize: 11, color: colors.textTertiary }]}>
                      Qty {qty}
                      {item.gst_rate ? ` · GST ${item.gst_rate}%` : ''}
                    </Text>
                  </View>
                  <Text style={styles.infoValue}>₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                </View>
              );
            })}
            {(() => {
              const subtotal = Number(invoice.subtotal);
              const gstTotal = Number(invoice.cgst_amount) + Number(invoice.sgst_amount) + Number(invoice.igst_amount);
              const total = Number(invoice.total_amount);
              return (
                <View style={{ marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderDivider, paddingTop: Spacing.sm }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Subtotal</Text>
                    <Text style={styles.infoValue}>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                  </View>
                  {gstTotal > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>GST</Text>
                      <Text style={styles.infoValue}>₹{gstTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                    </View>
                  )}
                  <View style={[styles.infoRow, { marginTop: 4 }]}>
                    <Text style={[styles.infoLabel, { fontWeight: Typography.fwSemibold }]}>Total</Text>
                    <Text style={[styles.infoValue, { fontWeight: Typography.fwBold }]}>
                      ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
        )}

        {/* Final bill — appears once pro completes the job. Pulls amount from
            the actual invoice (line items + GST + booking_charges). Hides
            once the customer has paid (collected >= invoice total). */}
        {booking.status === 'completed' && invoice && (() => {
          const total = Number(invoice.total_amount);
          const collected = Number(booking.payment_collected ?? 0);
          const owed = Math.max(0, total - collected);
          if (owed <= 0) {
            return (
              <View style={{ margin: Spacing.lg, marginBottom: 0, alignItems: 'flex-start' }}>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: colors.statusDelivered + '20' }}>
                  <Text style={{ fontSize: Typography.fsBody, color: colors.statusDelivered, fontWeight: Typography.fwSemibold }}>
                    Bill paid · ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            );
          }
          return (
            <View style={{ margin: Spacing.lg, marginBottom: 0 }}>
              <PrimaryButton
                height={48}
                label={`Pay Final Bill — ₹${owed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                onPress={() => handlePayment(owed)}
              />
            </View>
          );
        })()}

        {/* Cancellation charge — appears on cancelled bookings that triggered a
            tax_invoice (post-OTP). Same payment flow as the final bill. */}
        {booking.status === 'cancelled' && invoice && (() => {
          const total = Number(invoice.total_amount);
          const collected = Number(booking.payment_collected ?? 0);
          const owed = Math.max(0, total - collected);
          if (total <= 0) return null;
          if (owed <= 0) {
            return (
              <View style={{ margin: Spacing.lg, marginBottom: 0, alignItems: 'flex-start' }}>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: colors.statusDelivered + '20' }}>
                  <Text style={{ fontSize: Typography.fsBody, color: colors.statusDelivered, fontWeight: Typography.fwSemibold }}>
                    Cancellation charge paid · ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            );
          }
          return (
            <View style={{ margin: Spacing.lg, marginBottom: 0 }}>
              <PrimaryButton
                height={48}
                label={`Pay Cancellation Charge — ₹${owed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                onPress={() => handlePayment(owed)}
              />
            </View>
          );
        })()}

      </ScrollView>

      {showRatingDrawer && (
        <Modal transparent visible animationType="none" onRequestClose={closeRatingDrawer}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={closeRatingDrawer} />
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.bgCard,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
              paddingHorizontal: Spacing.xl,
              paddingTop: Spacing.lg,
              paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
              transform: [{ translateY: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
            }}
          >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderDivider, alignSelf: 'center', marginBottom: Spacing.lg }} />

              <Text style={{ fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs }}>
                Rate your service provider
              </Text>
              {booking?.pro && (
                <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }}>
                  {booking.pro.name}
                </Text>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.xl }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRatingValue(s)} activeOpacity={0.7}>
                    <Star
                      size={40}
                      color="#FBBF24"
                      fill={s <= ratingValue ? '#FBBF24' : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={{
                  height: 90,
                  backgroundColor: colors.bgInput,
                  borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderColor: colors.borderInput,
                  padding: Spacing.md,
                  fontSize: Typography.fsInput,
                  color: colors.textPrimary,
                  textAlignVertical: 'top',
                  marginBottom: Spacing.lg,
                }}
                value={ratingFeedback}
                onChangeText={setRatingFeedback}
                placeholder="Share your experience..."
                placeholderTextColor={colors.textTertiary}
                multiline
              />

              <PrimaryButton
                label={rateJobMutation.isPending ? '' : 'Submit Rating'}
                onPress={handleSubmitRating}
                disabled={ratingValue === 0 || rateJobMutation.isPending}
              />
              <TouchableOpacity onPress={closeRatingDrawer} activeOpacity={0.85}>
                <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>
                  Skip
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Animated.View>
        </Modal>
      )}

      {showCancelDrawer && (
        <Modal transparent visible animationType="none" onRequestClose={closeCancelDrawer}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={closeCancelDrawer} />
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.bgCard,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
              paddingHorizontal: Spacing.xl,
              paddingTop: Spacing.lg,
              paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
              transform: [{ translateY: cancelDrawerAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
            }}
          >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderDivider, alignSelf: 'center', marginBottom: Spacing.lg }} />

              <Text style={{ fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm }}>
                Cancel Booking
              </Text>
              <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }}>
                Please tell us why you want to cancel
              </Text>

              <TextInput
                style={{
                  height: 100,
                  backgroundColor: colors.bgInput,
                  borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderColor: colors.borderInput,
                  padding: Spacing.md,
                  fontSize: Typography.fsInput,
                  color: colors.textPrimary,
                  textAlignVertical: 'top',
                  marginBottom: Spacing.lg,
                }}
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Reason for cancellation..."
                placeholderTextColor={colors.textTertiary}
                multiline
              />

              <PrimaryButton
                height={48}
                label="Cancel Booking"
                onPress={() => setShowCancelConfirm(true)}
                disabled={!cancelReason.trim()}
              />
              <TouchableOpacity onPress={closeCancelDrawer} activeOpacity={0.85}>
                <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md }}>
                  Go Back
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Animated.View>
        </Modal>
      )}

      {showCancelConfirm && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setShowCancelConfirm(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl }}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', maxWidth: 340 }}>
              <Text style={{ fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm }}>
                Are you sure?
              </Text>
              <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 }}>
                This action cannot be undone. Cancellation charges may apply based on the current booking stage.
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity
                  onPress={() => setShowCancelConfirm(false)}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 48, borderRadius: Radius.md, borderWidth: 1.5,
                    borderColor: colors.borderInput, justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary }}>No, Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCancelConfirm}
                  disabled={cancelMutation.isPending}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 48, borderRadius: Radius.md,
                    backgroundColor: colors.statusReturned, justifyContent: 'center', alignItems: 'center',
                    opacity: cancelMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' }}>
                    {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showRejectPartsConfirm && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setShowRejectPartsConfirm(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl }}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', maxWidth: 340 }}>
              <Text style={{ fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm }}>
                Reject All Parts?
              </Text>
              <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 }}>
                All proposed parts will be rejected. The service provider can re-list parts or complete the job without them.
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity
                  onPress={() => setShowRejectPartsConfirm(false)}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 48, borderRadius: Radius.md, borderWidth: 1.5,
                    borderColor: colors.borderInput, justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary }}>No, Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmRejectAllParts}
                  disabled={approvePartsMutation.isPending}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 48, borderRadius: Radius.md,
                    backgroundColor: colors.statusReturned, justifyContent: 'center', alignItems: 'center',
                    opacity: approvePartsMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' }}>
                    {approvePartsMutation.isPending ? 'Rejecting...' : 'Yes, Reject All'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showSubmitPartsConfirm && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setShowSubmitPartsConfirm(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl }}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', maxWidth: 340 }}>
              <Text style={{ fontSize: Typography.fsSection, fontWeight: Typography.fwBold, color: colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm }}>
                Confirm Decision
              </Text>
              <Text style={{ fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 }}>
                Are you sure you want to submit your parts decision? This action cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity
                  onPress={() => setShowSubmitPartsConfirm(false)}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 48, borderRadius: Radius.md, borderWidth: 1.5,
                    borderColor: colors.borderInput, justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: colors.textPrimary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmSubmitParts}
                  disabled={approvePartsMutation.isPending}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 48, borderRadius: Radius.md,
                    backgroundColor: colors.brandNavy, justifyContent: 'center', alignItems: 'center',
                    opacity: approvePartsMutation.isPending ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' }}>
                    {approvePartsMutation.isPending ? 'Submitting...' : 'Yes, Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
