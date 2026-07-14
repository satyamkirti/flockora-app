import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { BirdPhotoBadge } from './BirdPhotoBadge';
import { TextButton } from './TextButton';
import { speciesByKey } from '../data/onboardingData';
import { Bird } from '../types/bird';
import { colors, radii, spacing } from '../theme';

type BirdPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  birds: Bird[];
  selectedBirdId: number | null;
  onSelect: (birdId: number | null) => void;
};

export function BirdPickerModal({ visible, onClose, birds, selectedBirdId, onSelect }: BirdPickerModalProps) {
  const handleSelect = (birdId: number | null) => {
    onSelect(birdId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <AppText variant="sectionTitle">Bird</AppText>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <Pressable
              style={styles.row}
              onPress={() => handleSelect(null)}
              accessibilityRole="button"
              accessibilityLabel="No Bird"
              accessibilityState={{ selected: selectedBirdId == null }}
            >
              <View style={styles.rowMain}>
                <AppText variant="cardTitle">No Bird</AppText>
              </View>
              {selectedBirdId == null ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.leafGreen} />
              ) : null}
            </Pressable>

            {birds.map((bird) => {
              const species = speciesByKey(bird.species);
              return (
                <Pressable
                  key={bird.id}
                  style={styles.row}
                  onPress={() => handleSelect(bird.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${bird.name}, ${bird.breed || species.label}`}
                  accessibilityState={{ selected: selectedBirdId === bird.id }}
                >
                  <BirdPhotoBadge icon={species.icon} photoUri={bird.photoUri} size={36} style={styles.avatar} />
                  <View style={styles.rowMain}>
                    <AppText variant="cardTitle">{bird.name}</AppText>
                    <AppText variant="caption" color={colors.mutedText}>
                      {bird.breed || species.label}
                    </AppText>
                  </View>
                  {selectedBirdId === bird.id ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.leafGreen} />
                  ) : null}
                </Pressable>
              );
            })}

            {birds.length === 0 ? (
              <AppText variant="caption" color={colors.mutedText} style={styles.emptyNote}>
                No birds yet. Add one from the Flock tab.
              </AppText>
            ) : null}
          </ScrollView>

          <TextButton label="Close" onPress={onClose} style={styles.closeButton} />
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
    maxHeight: '80%',
  },
  list: {
    marginTop: spacing.md,
    maxHeight: 360,
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
  avatar: {
    marginBottom: 0,
    marginRight: spacing.sm,
  },
  emptyNote: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
});
