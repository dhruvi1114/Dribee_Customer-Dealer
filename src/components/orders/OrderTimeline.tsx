import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

interface TimelineStep {
  step: string;
  timestamp: string;
  completed: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  const { colors } = useTheme();

  const currentIdx = steps.findIndex((s) => !s.completed) - 1;
  const activeIdx = currentIdx < 0 ? steps.length - 1 : currentIdx;

  return (
    <View style={{ paddingVertical: Spacing.md }}>
      {steps.map((step, i) => (
        <TimelineRow
          key={step.step}
          step={step}
          isActive={i === activeIdx && step.completed}
          isLast={i === steps.length - 1}
          colors={colors}
        />
      ))}
    </View>
  );
}

function TimelineRow({
  step,
  isActive,
  isLast,
  colors,
}: {
  step: TimelineStep;
  isActive: boolean;
  isLast: boolean;
  colors: ReturnType<typeof import('@/theme/ThemeContext').useTheme>['colors'];
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(withTiming(1.2, { duration: 700 }), -1, true);
    }
  }, [isActive, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    leftCol: { alignItems: 'center', width: 28 },
    circle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    line: { width: 2, flex: 1, minHeight: 28, backgroundColor: colors.borderCard },
    lineCompleted: { backgroundColor: colors.brandTeal },
    content: { flex: 1, paddingLeft: Spacing.md, paddingBottom: Spacing.xl },
    stepName: {
      fontSize: Typography.fsBody,
      fontWeight: Typography.fwMedium,
      color: colors.textPrimary,
    },
    timestamp: { fontSize: Typography.fsLabel, color: colors.textTertiary, marginTop: 2 },
  });

  const circleColor = step.completed
    ? isActive
      ? colors.brandAmber
      : colors.brandTeal
    : 'transparent';
  const circleBorder = step.completed ? 0 : 1.5;

  return (
    <View style={styles.row}>
      <View style={styles.leftCol}>
        <Animated.View style={[isActive ? pulseStyle : {}]}>
          <View
            style={[
              styles.circle,
              {
                backgroundColor: circleColor,
                borderWidth: circleBorder,
                borderColor: colors.borderCard,
              },
            ]}
          >
            {step.completed && <Check size={14} color="#fff" strokeWidth={2} />}
          </View>
        </Animated.View>
        {!isLast && (
          <View style={[styles.line, step.completed && styles.lineCompleted]} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.stepName}>{step.step}</Text>
        {step.timestamp ? <Text style={styles.timestamp}>{step.timestamp}</Text> : null}
      </View>
    </View>
  );
}
