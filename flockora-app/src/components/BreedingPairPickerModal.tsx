import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Bird } from '../types/bird';
import { BreedingPair } from '../types/breeding';
import { colors, radii, spacing } from '../theme';

type BreedingPairPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  pairs: BreedingPair[];
  birds: Bird[];
  selectedPairId: number | null;
  onSelect: (pairId: number | null) => void;
};

export function BreedingPairPickerModal({
  visible,
  onClose,
  pairs,
  birds,
  selectedPairId,
  onSelect,
}: BreedingPairPickerModalProps) {
  const handleSelect = (pairId: number | null) => {
    onSelect(pairId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <AppText variant="sectionTitle">Breeding Pair</AppText>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <Pressable
              style={styles.row}
              onPress={() => handleSelect(null)}
              accessibilityRole="button"
              accessibilityLabel="No Breeding Pair"
              accessibilityState={{ selected: selectedPairId == null }}
            >
              <View style={styles.rowMain}>
                <AppText variant="cardTitle">No Breeding Pair</AppText>
              </View>
              {selectedPairId == null ? <Ionicons name="checkmark-circle" size={22} color={colors.leafGreen} /> : null}
            </Pressable>

            {pairs.map((pair) => {
              const maleName = birds.find((bird) => bird.id === pair.maleBirdId)?.name ?? 'Unknown';
              const femaleName = birds.find((bird) => bird.id === pair.femaleBirdId)?.name ?? 'Unknown';
              return (
                <Pressable
                  key={pair.id}
                  style={styles.row}
                  onPress={() => handleSelect(pair.id)}
                  accessibilityRole="button"
                  accessibilityLabel={pair.pairName || `${maleName} and ${femaleName}`}
                  accessibilityState={{ selected: selectedPairId === pair.id }}
                >
                  <View style={styles.rowMain}>
                    <AppText variant="cardTitle">{pair.pairName || `${maleName} × ${femaleName}`}</AppText>
                    <AppText variant="caption" color={colors.mutedText}>
                      {maleName} × {femaleName}
                    </AppText>
                  </View>
                  {selectedPairId === pair.id ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.leafGreen} />
                  ) : null}
                </Pressable>
              );
            })}

            {pairs.length === 0 ? (
              <AppText variant="caption" color={colors.mutedText} style={styles.emptyNote}>
                No breeding pairs yet.
              </AppText>
            ) : null}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
            <AppText variant="button" color={colors.secondaryText}>
              Close
            </AppText>
          </Pressable>
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
  emptyNote: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
