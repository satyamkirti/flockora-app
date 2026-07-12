import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';
import { colors, radii, spacing } from '../theme';

type EditableFieldModalProps = {
  visible: boolean;
  label: string;
  value: string;
  onCancel: () => void;
  onSave: (nextValue: string) => void;
};

export function EditableFieldModal({ visible, label, value, onCancel, onSave }: EditableFieldModalProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <AppText variant="sectionTitle">Confirm {label}</AppText>
          <AppText variant="caption" color={colors.secondaryText} style={styles.hint}>
            Edit if this doesn't look right, then save your correction.
          </AppText>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            autoFocus
            placeholder={label}
            placeholderTextColor={colors.mutedText}
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <AppText variant="button" color={colors.secondaryText}>
                Cancel
              </AppText>
            </Pressable>
            <PrimaryButton label="Save" style={styles.saveButton} onPress={() => onSave(draft.trim() || value)} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33, 48, 38, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
  },
  hint: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
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
    backgroundColor: colors.warmCream,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  saveButton: {
    flex: 1,
  },
});
