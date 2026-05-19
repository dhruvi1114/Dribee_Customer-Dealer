import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { ArrowLeft, Camera } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import { useAppSelector } from '@/store/hooks';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/services/auth/auth.query';
import { useStates, useCities, useZones, useAreas } from '@/services/master/master.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import { AppDropdown } from '@/components/ui/Dropdown';
import type { ProfileStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

export function EditProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const cachedUser = useAppSelector((s) => s.auth.user);
  const { data: profile } = useProfile();
  const user = profile ?? cachedUser;

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('');
  const [cityId, setCityId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const { data: states = [] } = useStates();
  const { data: allCities = [] } = useCities(stateName || undefined);
  const { data: zones = [] } = useZones(cityId || undefined);
  const { data: areas = [] } = useAreas(zoneId || undefined);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setPhone(user.phone ?? '');
    setEmail(user.email ?? '');
    setAddress(user.address ?? '');
    setStateName(user.state_name ?? '');
    setCityId(user.city_id ?? '');
    setZoneId(user.zone_id ?? '');
    setAreaId(user.area_id ?? '');
    setUpiId(user.bank_details?.upi_id ?? '');
    setAccountHolder(user.bank_details?.account_holder ?? '');
    setAccountNumber(user.bank_details?.account_number ?? '');
    setIfsc(user.bank_details?.ifsc ?? '');
  }, [user]);

  const stateItems = states.map((s) => ({ label: s.name, value: s.name }));
  const cityItems = allCities.map((c) => ({ label: c.name, value: String(c.id) }));
  const zoneItems = zones.map((z) => ({ label: z.name, value: String(z.id) }));
  const areaItems = areas.map((a) => ({ label: a.name, value: String(a.id) }));

  const handlePickAvatar = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    if (result.assets?.[0]?.uri) {
      uploadAvatar.mutate(result.assets[0].uri);
    }
  }, [uploadAvatar]);

  const handleSave = useCallback(() => {
    const bankPartial: Record<string, string | null> = {};
    const cleanedUpi = upiId.trim();
    const cleanedHolder = accountHolder.trim();
    const cleanedNumber = accountNumber.trim();
    const cleanedIfsc = ifsc.trim().toUpperCase();
    if (cleanedUpi) bankPartial.upi_id = cleanedUpi;
    if (cleanedHolder) bankPartial.account_holder = cleanedHolder;
    if (cleanedNumber) bankPartial.account_number = cleanedNumber;
    if (cleanedIfsc) bankPartial.ifsc = cleanedIfsc;

    if (cleanedNumber && !cleanedIfsc) {
      Alert.alert('IFSC required', 'Enter the IFSC code along with the account number.');
      return;
    }
    if (cleanedIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanedIfsc)) {
      Alert.alert('Invalid IFSC', 'IFSC must be 11 chars, e.g. SBIN0001234.');
      return;
    }

    updateProfile.mutate(
      {
        name,
        phone,
        email,
        address,
        city_id: cityId || undefined,
        zone_id: zoneId || undefined,
        area_id: areaId || undefined,
        ...(Object.keys(bankPartial).length > 0 ? { bank_details: bankPartial } : {}),
      },
      { onSuccess: () => navigation.goBack() },
    );
  }, [name, phone, email, address, cityId, zoneId, areaId, upiId, accountHolder, accountNumber, ifsc, updateProfile, navigation]);

  const avatarUrl = resolveMediaUrl(user?.avatar);
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const isLoading = updateProfile.isPending;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
      gap: Spacing.md,
    },
    headerTitle: { flex: 1, fontSize: Typography.fsScreen, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    saveBtn: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: '#1A3353',
      borderRadius: Radius.sm,
    },
    saveBtnText: { fontSize: Typography.fsBody, fontWeight: Typography.fwSemibold, color: '#fff' },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
      backgroundColor: colors.bgCard,
      marginBottom: Spacing.sm,
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: '#1A3353',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { fontSize: 28, fontWeight: Typography.fwBold, color: '#fff' },
    avatarImage: { width: 88, height: 88, borderRadius: 44 },
    cameraBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.brandBlue,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.bgCard,
    },
    avatarHint: { fontSize: Typography.fsBody, color: colors.textTertiary, marginTop: Spacing.sm },
    card: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDivider,
      marginBottom: Spacing.xs,
    },
    label: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.xs,
      marginTop: Spacing.lg,
    },
    input: {
      height: 52,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
    },
    addressInput: {
      height: 80,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading} activeOpacity={0.85}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.85}>
              {avatarUrl && !uploadAvatar.isPending ? (
                <FastImage
                  style={styles.avatarImage}
                  source={{ uri: avatarUrl, priority: FastImage.priority.normal }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <View style={styles.avatar}>
                  {uploadAvatar.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Camera size={14} color="#fff" strokeWidth={1.5} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Info</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit phone number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Address</Text>

            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor={colors.textTertiary}
              multiline
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
                  setCityId('');
                  setZoneId('');
                  setAreaId('');
                }
              }}
            />

            <AppDropdown
              label="City"
              data={cityItems}
              value={cityId}
              placeholder={stateName ? 'Select city' : 'Select state first'}
              disabled={!stateName}
              searchable
              onChange={(val) => {
                setCityId(val);
                setZoneId('');
                setAreaId('');
              }}
            />

            <AppDropdown
              label="Zone"
              data={zoneItems}
              value={zoneId}
              placeholder={cityId ? 'Select zone' : 'Select city first'}
              disabled={!cityId}
              onChange={(val) => {
                setZoneId(val);
                setAreaId('');
              }}
            />

            <AppDropdown
              label="Area"
              data={areaItems}
              value={areaId}
              placeholder={zoneId ? 'Select area' : 'Select zone first'}
              disabled={!zoneId}
              onChange={setAreaId}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Refund Details</Text>
            <Text style={{ fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: Spacing.sm }}>
              Used by our team to send refunds for cancelled or returned orders. Either UPI ID, or bank details — whichever is easier for you.
            </Text>

            <Text style={styles.label}>UPI ID (optional)</Text>
            <TextInput
              style={styles.input}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="yourname@bank"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              value={accountHolder}
              onChangeText={setAccountHolder}
              placeholder="Name as on bank passbook"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Bank account number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={20}
            />

            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              value={ifsc}
              onChangeText={(t) => setIfsc(t.toUpperCase())}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={11}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
