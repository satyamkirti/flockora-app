import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText } from './AppText';
import { EditableFieldModal } from './EditableFieldModal';
import { flockRepository } from '../db/repositories';
import { createEmptyFlockInput, FlockWithCount } from '../types/flock';
import { colors, radii, spacing } from '../theme';

type FlockManagerModalProps = {
  visible: boolean;
  onClose: () => void;
  flocks: FlockWithCount[];
  onChanged: () => void;
  selectable?: boolean;
  selectedFlockId?: number | null;
  onSelect?: (flockId: number | null) => void;
  /** Optional — when provided, an extra icon appears per row for opening the full
   *  species/breed/purpose/notes editor (AddEditFlockScreen). Omitted by callers that don't
   *  have navigation available (e.g. the flock picker inside AddEditBirdScreen). */
  onEditDetails?: (flock: FlockWithCount) => void;
};

export function FlockManagerModal({
  visible,
  onClose,
  flocks,
  onChanged,
  selectable = false,
  selectedFlockId = null,
  onSelect,
  onEditDetails,
}: FlockManagerModalProps) {
  const db = useSQLiteContext();
  const [newFlockName, setNewFlockName] = useState('');
  const [renamingFlock, setRenamingFlock] = useState<FlockWithCount | null>(null);

  const handleCreate = async () => {
    const name = newFlockName.trim();
    if (!name) return;
    await flockRepository.create(db, { ...createEmptyFlockInput(), name });
    setNewFlockName('');
    onChanged();
  };

  const handleDelete = (flock: FlockWithCount) => {
    Alert.alert('Delete flock', `Delete "${flock.name}"? Birds in this flock will become unassigned.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await flockRepository.remove(db, flock.id);
          onChanged();
        },
      },
    ]);
  };

  const handleSelectRow = (flockId: number | null) => {
    if (!selectable) return;
    onSelect?.(flockId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <AppText variant="sectionTitle">Flocks</AppText>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {selectable ? (
              <Pressable
                style={styles.row}
                onPress={() => handleSelectRow(null)}
                accessibilityRole="button"
                accessibilityLabel="No Flock"
                accessibilityState={{ selected: selectedFlockId == null }}
              >
                <View style={styles.rowMain}>
                  <AppText variant="cardTitle">No Flock</AppText>
                </View>
                {selectedFlockId == null ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.leafGreen} />
                ) : null}
              </Pressable>
            ) : null}

            {flocks.map((flock) => (
              <View key={flock.id} style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => handleSelectRow(flock.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${flock.name}, ${flock.birdCount} ${flock.birdCount === 1 ? 'bird' : 'birds'}`}
                  accessibilityState={{ selected: selectable && selectedFlockId === flock.id }}
                >
                  <AppText variant="cardTitle">{flock.name}</AppText>
                  <AppText variant="caption" color={colors.mutedText}>
                    {flock.birdCount} {flock.birdCount === 1 ? 'bird' : 'birds'}
                  </AppText>
                </Pressable>
                {selectable && selectedFlockId === flock.id ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.leafGreen} style={styles.rowIcon} />
                ) : null}
                {onEditDetails ? (
                  <Pressable
                    style={styles.rowIcon}
                    onPress={() => {
                      onClose();
                      onEditDetails(flock);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Manage ${flock.name} details`}
                  >
                    <Ionicons name="options-outline" size={18} color={colors.mutedText} />
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.rowIcon}
                  onPress={() => setRenamingFlock(flock)}
                  accessibilityRole="button"
                  accessibilityLabel={`Rename ${flock.name}`}
                >
                  <Ionicons name="pencil" size={18} color={colors.mutedText} />
                </Pressable>
                <Pressable
                  style={styles.rowIcon}
                  onPress={() => handleDelete(flock)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${flock.name}`}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.alertCoral} />
                </Pressable>
              </View>
            ))}

            {flocks.length === 0 ? (
              <AppText variant="caption" color={colors.mutedText} style={styles.emptyNote}>
                No flocks yet. Create one below.
              </AppText>
            ) : null}
          </ScrollView>

          <View style={styles.createRow}>
            <TextInput
              value={newFlockName}
              onChangeText={setNewFlockName}
              placeholder="New flock name"
              placeholderTextColor={colors.mutedText}
              style={styles.createInput}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
              accessibilityLabel="New flock name"
            />
            <Pressable
              style={styles.addButton}
              onPress={handleCreate}
              accessibilityRole="button"
              accessibilityLabel="Add flock"
            >
              <Ionicons name="add" size={22} color={colors.cardSurface} />
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
            <AppText variant="button" color={colors.secondaryText}>
              Close
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>

      {renamingFlock ? (
        <EditableFieldModal
          visible={Boolean(renamingFlock)}
          label="Flock Name"
          value={renamingFlock.name}
          onCancel={() => setRenamingFlock(null)}
          onSave={async (nextValue) => {
            await flockRepository.rename(db, renamingFlock.id, nextValue);
            setRenamingFlock(null);
            onChanged();
          }}
        />
      ) : null}
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
    maxHeight: '80%',
  },
  list: {
    marginTop: spacing.md,
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowMain: {
    flex: 1,
  },
  rowIcon: {
    marginLeft: spacing.md,
  },
  emptyNote: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  createInput: {
    flex: 1,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.leafGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
