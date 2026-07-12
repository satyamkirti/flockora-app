import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '../theme';

type FormFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  optional?: boolean;
};

export function FormField({ label, optional, multiline, ...rest }: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <AppText variant="cardTitle">{label}</AppText>
        {optional ? (
          <AppText variant="caption" color={colors.mutedText}>
            {' '}
            (optional)
          </AppText>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor={colors.mutedText}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.primaryText,
    backgroundColor: colors.cardSurface,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
