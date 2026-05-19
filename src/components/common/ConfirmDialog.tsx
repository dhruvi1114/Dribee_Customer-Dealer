import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { PrimaryButton } from './PrimaryButton';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Secondary action — closes the dialog. */
  dismissLabel?: string;
  /** Primary action (e.g. confirm destructive operation). */
  confirmLabel: string;
  onDismiss: () => void;
  onConfirm: () => void;
  loading?: boolean;
  /** Style confirm button with danger color (e.g. cancel order). */
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  dismissLabel = 'Not now',
  confirmLabel,
  onDismiss,
  onConfirm,
  loading = false,
  destructive = false,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const confirmColor = destructive ? colors.statusReturned : colors.brandAmber;

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    sheet: {
      width: '100%',
      maxWidth: 360,
      borderRadius: Radius.lg,
      backgroundColor: colors.bgCard,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.borderDivider,
    },
    title: {
      fontSize: Typography.fsSection,
      fontWeight: Typography.fwBold,
      color: colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    message: {
      fontSize: Typography.fsBody,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: Spacing.lg,
    },
    btnRow: { flexDirection: 'row', gap: Spacing.sm },
    btnCol: { flex: 1, minWidth: 0 },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? undefined : onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={loading ? undefined : onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss dialog"
      >
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.btnRow}>
            <View style={styles.btnCol}>
              <PrimaryButton
                height={48}
                label={dismissLabel}
                variant="outlined"
                color={colors.brandNavy}
                onPress={onDismiss}
                disabled={loading}
              />
            </View>
            <View style={styles.btnCol}>
              <PrimaryButton
                height={48}
                label={confirmLabel}
                variant="filled"
                color={confirmColor}
                onPress={onConfirm}
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
