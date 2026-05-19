import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  FileText,
  Bell,
  Headphones,
  ChevronRight,
  LogOut,
  Moon,
  Heart,
  Settings,
  Pencil,
  RotateCcw,
  Package,
  CalendarCheck,
} from 'lucide-react-native';

import FastImage from 'react-native-fast-image';

import { useTheme } from '@/theme/ThemeContext';
import { useAppSelector } from '@/store/hooks';
import { useLogout, useProfile } from '@/services/auth/auth.query';
import { useOrders } from '@/services/orders/orders.query';
import { useReturns } from '@/services/returns/returns.query';
import { useWishlist } from '@/services/wishlist/wishlist.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import type { AppTabParamList, ProfileStackParamList } from '@/navigation/types';

type ProfileScreenNav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  BottomTabNavigationProp<AppTabParamList>
>;

export function ProfileScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const navigation = useNavigation<ProfileScreenNav>();
  const cachedUser = useAppSelector((s) => s.auth.user);
  const { data: profileData, isLoading } = useProfile();
  const user = profileData ?? cachedUser;
  const isDealer = user?.role === 'dealer_owner';
  const isDealerRole = user?.role === 'dealer_owner' || user?.role === 'dealer_staff';
  const logoutMutation = useLogout();

  const loggedIn = !!user;
  const { data: ordersData, isLoading: ordersLoading } = useOrders(undefined, { enabled: loggedIn });
  const { data: wishlistData, isLoading: wishlistLoading } = useWishlist(loggedIn);
  const { data: returnsData, isLoading: returnsLoading } = useReturns(loggedIn);

  const ordersTotal = ordersData?.pagination?.total ?? 0;
  const wishlistTotal = wishlistData?.count ?? wishlistData?.items.length ?? 0;
  const returnsTotal = returnsData?.length ?? 0;

  const profileStats = useMemo(
    () => [
      {
        id: 'stat-orders',
        label: 'Orders',
        count: ordersTotal,
        loading: ordersLoading,
        onPress: () => navigation.navigate('CartTab', { screen: 'Orders' }),
      },
      {
        id: 'stat-wishlist',
        label: 'Wishlist',
        count: wishlistTotal,
        loading: wishlistLoading,
        onPress: () => navigation.navigate('Wishlist'),
      },
      {
        id: 'stat-returns',
        label: 'Returns',
        count: returnsTotal,
        loading: returnsLoading,
        onPress: () => navigation.navigate('ReturnsList'),
      },
    ],
    [
      navigation,
      ordersLoading,
      ordersTotal,
      returnsLoading,
      returnsTotal,
      wishlistLoading,
      wishlistTotal,
    ],
  );

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const avatarDisplayUri = resolveMediaUrl(user?.avatar);

  const handleLogout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const menuItems = [
    { id: 'addresses', label: 'My Addresses', icon: MapPin, onPress: () => navigation.navigate('Addresses') },
    {
      id: 'orders',
      label: 'My Orders',
      icon: Package,
      onPress: () => navigation.navigate('CartTab', { screen: 'Orders' }),
    },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, onPress: () => navigation.navigate('Wishlist') },
    { id: 'bookings', label: 'My Bookings', icon: CalendarCheck, onPress: () => navigation.navigate('ServicesTab', { screen: 'MyBookings' }) },
    { id: 'returns', label: 'My Returns', icon: RotateCcw, onPress: () => navigation.navigate('ReturnsList') },
    { id: 'notifications', label: 'Notifications', icon: Bell, onPress: () => navigation.navigate('Notifications') },
    { id: 'support', label: 'Help & Support', icon: Headphones, onPress: () => {} },
    ...(isDealer ? [{ id: 'quotations', label: 'Quotations', icon: FileText, onPress: () => {} }] : []),
  ];

  const gstin = (user as { gst_number?: string } | null | undefined)?.gst_number?.trim();

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    titleBar: {
      width: '100%',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E8ECF0',
    },
    listWrap: { flex: 1 },
    profileTop: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    screenTitle: {
      fontSize: Typography.fsScreen,
      fontWeight: Typography.fwSemibold,
      color: colors.brandNavy,
    },
    settingsBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userCard: {
      position: 'relative',
      marginBottom: Spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderCard,
    },
    userMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { fontSize: 22, fontWeight: Typography.fwBold, color: colors.brandTeal },
    avatarImage: { width: 64, height: 64, borderRadius: 32 },
    userTextBlock: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
      gap: 2,
      paddingRight: 30,
    },
    userName: {
      fontSize: Typography.fsSection,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
    },
    userMeta: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwRegular,
      color: colors.textSecondary,
    },
    userGst: {
      fontSize: Typography.fsCaption,
      fontWeight: Typography.fwRegular,
      color: colors.textTertiary,
    },
    editCornerBtn: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      zIndex: 1,
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.brandBlue,
      backgroundColor: colors.bgCard,
    },
    quickActionsWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    quickActionItem: {
      flex: 1,
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 72,
      gap: 4,
    },
    quickActionCount: {
      fontSize: 20,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
    },
    quickActionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: Typography.fwMedium,
    },
    sectionTitle: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      fontSize: Typography.fsBody,
      color: colors.textTertiary,
      fontWeight: Typography.fwSemibold,
    },
    optionsCard: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.xl,
      marginHorizontal: Spacing.lg,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgCard,
      padding: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderDivider,
      gap: Spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuLabel: { flex: 1, fontSize: Typography.fsProduct, color: colors.textPrimary },
    darkModeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      padding: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderDivider,
      gap: Spacing.md,
    },
    darkModeLabel: { flex: 1, fontSize: Typography.fsProduct, color: colors.textPrimary },
    logoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    logoutText: { fontSize: Typography.fsProduct, color: colors.statusReturned },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.titleBar} accessibilityRole="header">
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
            accessibilityLabel="Profile settings"
          >
            <Settings size={22} color={colors.brandNavy} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        style={styles.listWrap}
        data={menuItems}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.profileTop}>
              {isLoading && !user ? (
                <ActivityIndicator size="large" color={colors.brandNavy} style={{ marginVertical: Spacing.xl }} />
              ) : (
                <View style={styles.userCard}>
                  <TouchableOpacity
                    style={styles.editCornerBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('EditProfile')}
                    accessibilityLabel="Edit profile"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Pencil size={13} color={colors.brandBlue} strokeWidth={1.5} />
                  </TouchableOpacity>
                  <View style={styles.userMainRow}>
                    {avatarDisplayUri ? (
                      <FastImage
                        style={styles.avatarImage}
                        source={{ uri: avatarDisplayUri, priority: FastImage.priority.normal }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                    )}
                    <View style={styles.userTextBlock}>
                      <Text style={styles.userName} numberOfLines={2}>
                        {user?.name ?? 'User'}
                      </Text>
                      {user?.phone ? <Text style={styles.userMeta}>{user.phone}</Text> : null}
                      {isDealerRole && gstin ? (
                        <Text style={styles.userGst} numberOfLines={1}>
                          GSTIN: {gstin}
                        </Text>
                      ) : null}
                      {user?.email ? (
                        <Text style={styles.userMeta} numberOfLines={1}>
                          {user.email}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              )}
            </View>
            {loggedIn ? (
              <View style={styles.quickActionsWrap}>
                {profileStats.map((row) => (
                  <TouchableOpacity
                    key={row.id}
                    style={styles.quickActionItem}
                    activeOpacity={0.85}
                    onPress={row.onPress}
                  >
                    {row.loading ? (
                      <ActivityIndicator size="small" color="#0F79A8" />
                    ) : (
                      <Text style={styles.quickActionCount}>{row.count}</Text>
                    )}
                    <Text style={styles.quickActionLabel}>{row.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {/* <Text style={styles.sectionTitle}>Account Options</Text> */}
          </>
        }
        renderItem={({ item, index }) => {
          const Icon = item.icon;
          const isFirst = index === 0;
          const isLast = index === menuItems.length - 1;
          return (
            <TouchableOpacity
              style={[
                styles.menuItem,
                { marginHorizontal: Spacing.lg },
                isFirst && {
                  borderTopLeftRadius: Radius.xl,
                  borderTopRightRadius: Radius.xl,
                },
                isLast && {
                  borderBottomWidth: 0,
                  borderBottomLeftRadius: Radius.xl,
                  borderBottomRightRadius: Radius.xl,
                  marginBottom: Spacing.md,
                },
              ]}
              onPress={item.onPress}
              activeOpacity={0.85}
            >
              <View style={styles.iconWrap}>
                <Icon size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.darkModeRow} onPress={toggleTheme} activeOpacity={0.85}>
              <View style={styles.iconWrap}>
                <Moon size={18} color={colors.textSecondary} strokeWidth={1.5} />
              </View>
              <Text style={styles.darkModeLabel}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.borderCard, true: colors.brandNavy }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.85}>
              <View style={[styles.iconWrap, { backgroundColor: colors.statusReturned + '15' }]}>
                <LogOut size={18} color={colors.statusReturned} strokeWidth={1.5} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
