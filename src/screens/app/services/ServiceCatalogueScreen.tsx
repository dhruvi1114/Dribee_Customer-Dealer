import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { useServiceCatalogue } from '@/services/services/services.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';
import type { ServiceCatalogueItem } from '@/types/service';

type Nav = NativeStackNavigationProp<ServicesStackParamList>;

export function ServiceCatalogueScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();

  const { data: services, isLoading } = useServiceCatalogue();

  const handleBook = useCallback(
    (service: ServiceCatalogueItem) =>
      navigation.navigate('BookService', { serviceId: String(service.id) }),
    [navigation],
  );

  const handleMyBookings = useCallback(() => navigation.navigate('MyBookings'), [navigation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    myBookingsBtn: { fontSize: Typography.fsBody, color: colors.brandBlue, fontWeight: Typography.fwMedium },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
    initialsCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initialsText: { fontSize: 18, fontWeight: Typography.fwBold, color: colors.brandNavy, opacity: 0.6 },
    serviceName: { fontSize: Typography.fsProduct, fontWeight: Typography.fwSemibold, color: colors.textPrimary },
    serviceDesc: { fontSize: Typography.fsBody, color: colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    priceNormal: { fontSize: Typography.fsProduct, fontWeight: Typography.fwBold, color: colors.brandNavy },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Services"
        rightComponent={
          <TouchableOpacity onPress={handleMyBookings} activeOpacity={0.85}>
            <Text style={styles.myBookingsBtn}>My Bookings</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      ) : (
        <FlatList
          data={services ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const initials = item.name.slice(0, 2).toUpperCase();
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.initialsCircle}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    {item.service_type_name ? (
                      <Text style={{ fontSize: Typography.fsLabel, color: colors.textTertiary }}>{item.service_type_name}</Text>
                    ) : null}
                  </View>
                </View>
                {item.description ? (
                  <Text style={styles.serviceDesc}>{item.description}</Text>
                ) : null}
                <View style={styles.priceRow}>
                  <Text style={styles.priceNormal}>₹{item.base_fee?.toLocaleString('en-IN') ?? '—'}</Text>
                  {item.slot_duration_mins ? (
                    <Text style={{ fontSize: Typography.fsBody, color: colors.textTertiary }}>
                      ~{item.slot_duration_mins} min
                    </Text>
                  ) : null}
                </View>
                <PrimaryButton label="Book Now" height={48} onPress={() => handleBook(item)} />
              </View>
            );
          }}
          ListEmptyComponent={<EmptyState title="No services available" subtitle="Check back soon" />}
        />
      )}
    </SafeAreaView>
  );
}
