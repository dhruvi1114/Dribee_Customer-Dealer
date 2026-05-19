import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Star } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useBooking, useRateJob } from '@/services/services/services.query';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { ServicesStackParamList } from '@/navigation/types';

type Route = RouteProp<ServicesStackParamList, 'JobRating'>;

export function JobRatingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { bookingId } = route.params;

  const { data: booking, isLoading } = useBooking(bookingId);
  const rateJobMutation = useRateJob();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = useCallback(() => {
    // Backend rate endpoint takes service_jobs.id, not booking id.
    const jobId = booking?.service_job_id ?? booking?.jobId;
    if (!jobId) return;
    rateJobMutation.mutate(
      { jobId, data: { rating, comment: feedback.trim() || undefined } },
      { onSuccess: () => navigation.goBack() },
    );
  }, [rateJobMutation, booking, rating, feedback, navigation]);

  const handleSkip = useCallback(() => navigation.goBack(), [navigation]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, padding: Spacing.xl, alignItems: 'center' },
    proAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.bgSection,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    avatarText: { fontSize: 24, fontWeight: Typography.fwBold, color: colors.brandNavy, opacity: 0.6 },
    proName: { fontSize: Typography.fsSection, fontWeight: Typography.fwSemibold, color: colors.textPrimary, marginBottom: Spacing.xs },
    serviceName: { fontSize: Typography.fsBody, color: colors.textSecondary, marginBottom: Spacing.xxl },
    starsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xxl },
    textArea: {
      width: '100%',
      height: 100,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      padding: Spacing.md,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
      textAlignVertical: 'top',
      marginBottom: Spacing.xl,
    },
    btnWrap: { width: '100%', gap: Spacing.md },
    skipText: { fontSize: Typography.fsBody, color: colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md },
  });

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Rate Your Service" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      </SafeAreaView>
    );
  }

  const proInitials = booking.pro?.name.slice(0, 2).toUpperCase() ?? 'PR';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Rate Your Service" showBack />
      <View style={styles.container}>
        <View style={styles.proAvatar}>
          <Text style={styles.avatarText}>{proInitials}</Text>
        </View>
        <Text style={styles.proName}>{booking.pro?.name ?? 'Service Pro'}</Text>
        <Text style={styles.serviceName}>{booking.serviceName}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.85}>
              <Star
                size={40}
                color={colors.brandAmber}
                fill={s <= rating ? colors.brandAmber : 'transparent'}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.textArea}
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Share your experience..."
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        <View style={styles.btnWrap}>
          <PrimaryButton
            label={rateJobMutation.isPending ? '' : 'Submit Rating'}
            onPress={handleSubmit}
            disabled={rating === 0 || rateJobMutation.isPending}
          />
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.85}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
