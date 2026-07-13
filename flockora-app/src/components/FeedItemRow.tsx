import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { StatusPill } from './StatusPill';
import { FeedExpiryState, FeedStockState } from '../types/feed';
import { colors, spacing } from '../theme';

type FeedItemRowProps = {
  icon: string;
  name: string;
  feedTypeLabel: string;
  quantityLabel: string;
  stockState: FeedStockState;
  expiryState: FeedExpiryState;
  onPress: () => void;
  onDelete: () => void;
};

export function FeedItemRow({
  icon,
  name,
  feedTypeLabel,
  quantityLabel,
  stockState,
  expiryState,
  onPress,
  onDelete,
}: FeedItemRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <AppText style={styles.icon}>{icon}</AppText>
      <View style={styles.content}>
        <AppText variant="cardTitle">{name}</AppText>
        <AppText variant="caption" color={colors.secondaryText}>
          {feedTypeLabel} · {quantityLabel}
        </AppText>
        {stockState !== 'ok' || expiryState === 'expired' || expiryState === 'expiring' ? (
          <View style={styles.badgeRow}>
            {stockState === 'out' ? <StatusPill label="Out of Stock" tone="warning" /> : null}
            {stockState === 'low' ? <StatusPill label="Low Stock" tone="warning" /> : null}
            {expiryState === 'expired' ? <StatusPill label="Expired" tone="warning" /> : null}
            {expiryState === 'expiring' ? <StatusPill label="Expiring Soon" tone="warning" /> : null}
          </View>
        ) : null}
      </View>
      <Pressable style={styles.deleteIcon} onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.alertCoral} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  deleteIcon: {
    marginLeft: spacing.sm,
  },
});
