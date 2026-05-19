import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ChevronDown } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

export interface DropdownItem {
  label: string;
  value: string;
}

interface AppDropdownProps {
  label?: string;
  placeholder?: string;
  data: DropdownItem[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
}

export function AppDropdown({
  label,
  placeholder = 'Select...',
  data,
  value,
  onChange,
  disabled = false,
  searchable = false,
}: AppDropdownProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    label: {
      fontSize: Typography.fsLabel,
      fontWeight: Typography.fwSemibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.xs,
      marginTop: Spacing.lg,
    },
    container: {
      height: 52,
      backgroundColor: colors.bgInput,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderInput,
      paddingHorizontal: Spacing.lg,
      opacity: disabled ? 0.5 : 1,
    },
    selectedText: {
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
    },
    placeholder: {
      fontSize: Typography.fsInput,
      color: colors.textTertiary,
    },
    dropdownContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.borderInput,
      overflow: 'hidden',
      marginTop: 4,
    },
    inputSearch: {
      height: 44,
      fontSize: Typography.fsInput,
      color: colors.textPrimary,
      borderColor: colors.borderInput,
    },
  });

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <Dropdown
        data={data}
        labelField="label"
        valueField="value"
        value={value || null}
        onChange={(item) => onChange(item.value)}
        placeholder={placeholder}
        disable={disabled}
        search={searchable}
        style={styles.container}
        containerStyle={styles.dropdownContainer}
        selectedTextStyle={styles.selectedText}
        placeholderStyle={styles.placeholder}
        inputSearchStyle={styles.inputSearch}
        activeColor={colors.borderInput}
        renderRightIcon={() => (
          <ChevronDown size={18} color={colors.textTertiary} strokeWidth={1.5} />
        )}
      />
    </View>
  );
}
