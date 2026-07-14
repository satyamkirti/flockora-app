import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { feedTypeByKey } from '../data/feedTypes';
import { FeedItem } from '../types/feed';
import { colors, radii, spacing } from '../theme';

type FeedItemPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  items: FeedItem[];
  selectedFeedItemId: number | null;
  onSelect: (feedItemId: number) => void;
};

export function FeedItemPickerModal({ visible, onClose, items, selectedFeedItemId, onSelect }: FeedItemPickerModalProps) {
  const handleSelect = (feedItemId: number) => {
    onSelect(feedItemId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <AppText variant="sectionTitle">Feed</AppText>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const typeOption = feedTypeByKey(item.feedType);
              return (
                <Pressable
                  key={item.id}
                  style={styles.row}
                  onPress={() => handleSelect(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit} available`}
                  accessibilityState={{ selected: selectedFeedItemId === item.id }}
                >
                  <AppText style={styles.icon}>{typeOption.icon}</AppText>
                  <View style={styles.rowMain}>
                    <AppText variant="cardTitle">{item.name}</AppText>
                    <AppText variant="caption" color={colors.mutedText}>
                      {item.quantity} {item.unit} available
                    </AppText>
                  </View>
                  {selectedFeedItemId === item.id ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.leafGreen} />
                  ) : null}
                </Pressable>
              );
            })}

            {items.length === 0 ? (
              <AppText variant="caption" color={colors.mutedText} style={styles.emptyNote}>
                No feed items yet. Add one first.
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
  icon: {
    fontSize: 22,
    marginRight: spacing.sm,
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
