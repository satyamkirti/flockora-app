import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  FormField,
  SelectableCard,
  FadeInUp,
  ScreenHeader,
  NotificationPreviewCard,
} from '../components';
import { useFeedItem } from '../hooks';
import { feedRepository } from '../db/repositories';
import {
  NOTIFICATION_CATEGORIES,
  buildFeedExpiryReminderDate,
  syncFeedExpiryReminder,
  warnIfNotificationPermissionMissing,
} from '../services/notificationService';
import { feedTypeOptions } from '../data/feedTypes';
import { FeedItemInput, createEmptyFeedItemInput } from '../types/feed';
import { isValidDateString } from '../utils/formValidation';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'AddEditFeedItem'>;

function parseOptionalNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function AddEditFeedItemScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const isEditing = itemId != null;
  const db = useSQLiteContext();
  const { item: existingItem, loading: loadingItem } = useFeedItem(itemId);

  const [form, setForm] = useState<FeedItemInput>(createEmptyFeedItemInput());
  const [quantityText, setQuantityText] = useState('0');
  const [thresholdText, setThresholdText] = useState('');
  const [costText, setCostText] = useState('');
  const [purchaseDateText, setPurchaseDateText] = useState(form.purchaseDate ?? '');
  const [expiryDateText, setExpiryDateText] = useState('');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (isEditing && existingItem && !hydrated) {
      setForm({
        name: existingItem.name,
        feedType: existingItem.feedType,
        brand: existingItem.brand,
        quantity: existingItem.quantity,
        unit: existingItem.unit,
        lowStockThreshold: existingItem.lowStockThreshold,
        costPerUnit: existingItem.costPerUnit,
        purchaseDate: existingItem.purchaseDate,
        expiryDate: existingItem.expiryDate,
        notes: existingItem.notes,
      });
      setQuantityText(String(existingItem.quantity));
      setThresholdText(existingItem.lowStockThreshold != null ? String(existingItem.lowStockThreshold) : '');
      setCostText(existingItem.costPerUnit != null ? String(existingItem.costPerUnit) : '');
      setPurchaseDateText(existingItem.purchaseDate ?? '');
      setExpiryDateText(existingItem.expiryDate ?? '');
      setHydrated(true);
    }
  }, [isEditing, existingItem, hydrated]);

  const update = (patch: Partial<FeedItemInput>) => setForm((current) => ({ ...current, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please give this feed a name.');
      return;
    }
    if (!form.unit.trim()) {
      Alert.alert('Unit required', 'Please enter a unit, e.g. kg, lb, or bags.');
      return;
    }
    if (expiryDateText.trim() && !isValidDateString(expiryDateText.trim())) {
      Alert.alert('Invalid expiry date', 'Please use YYYY-MM-DD for the expiry date.');
      return;
    }
    if (purchaseDateText.trim() && !isValidDateString(purchaseDateText.trim())) {
      Alert.alert('Invalid purchase date', 'Please use YYYY-MM-DD for the purchase date.');
      return;
    }

    const payload: FeedItemInput = {
      ...form,
      name: form.name.trim(),
      brand: form.brand?.trim() || null,
      unit: form.unit.trim(),
      quantity: parseOptionalNumber(quantityText) ?? 0,
      lowStockThreshold: parseOptionalNumber(thresholdText),
      costPerUnit: parseOptionalNumber(costText),
      purchaseDate: purchaseDateText.trim() || null,
      expiryDate: expiryDateText.trim() || null,
      notes: form.notes?.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && itemId != null) {
        const updated = await feedRepository.updateFeedItem(db, itemId, payload);
        const notificationId = await syncFeedExpiryReminder(updated, existingItem?.notificationId ?? null);
        await feedRepository.setNotificationId(db, itemId, notificationId);
        await warnIfNotificationPermissionMissing(Boolean(payload.expiryDate) && !notificationId);
      } else {
        const created = await feedRepository.createFeedItem(db, payload);
        const notificationId = await syncFeedExpiryReminder(created, null);
        if (notificationId) {
          await feedRepository.setNotificationId(db, created.id, notificationId);
        }
        await warnIfNotificationPermissionMissing(Boolean(payload.expiryDate) && !notificationId);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not save this feed item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const previewExpiryDate = expiryDateText.trim() && isValidDateString(expiryDateText.trim()) ? expiryDateText.trim() : null;
  const previewScheduledDate = previewExpiryDate ? buildFeedExpiryReminderDate(previewExpiryDate) : null;
  const previewIsPast = previewScheduledDate != null && previewScheduledDate.getTime() <= Date.now();
  const previewDisabledReason = !previewExpiryDate
    ? 'Enter an expiry date to schedule a reminder'
    : 'This reminder date has already passed';

  if (isEditing && loadingItem && !hydrated) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title={isEditing ? 'Edit Feed' : 'Add Feed'} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <FormField
            label="Name"
            value={form.name}
            onChangeText={(text) => update({ name: text })}
            placeholder="e.g. Layer Pellets"
          />

          <FadeInUp style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Feed Type
            </AppText>
            <View style={styles.typeGrid}>
              {feedTypeOptions.map((option) => (
                <View key={option.key} style={styles.typeItem}>
                  <SelectableCard
                    icon={option.icon}
                    label={option.label}
                    selected={form.feedType === option.key}
                    onPress={() => update({ feedType: option.key })}
                  />
                </View>
              ))}
            </View>
          </FadeInUp>

          <FormField
            label="Brand"
            optional
            value={form.brand ?? ''}
            onChangeText={(text) => update({ brand: text })}
            placeholder="e.g. Purina"
          />

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField
                label="Quantity"
                value={quantityText}
                onChangeText={setQuantityText}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.countInput}>
              <FormField
                label="Unit"
                value={form.unit}
                onChangeText={(text) => update({ unit: text })}
                placeholder="kg, lb, bags"
              />
            </View>
          </View>

          <FormField
            label="Low Stock Threshold"
            optional
            value={thresholdText}
            onChangeText={setThresholdText}
            placeholder="Alert when at or below this amount"
            keyboardType="decimal-pad"
          />

          <FormField
            label="Cost Per Unit"
            optional
            value={costText}
            onChangeText={setCostText}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <View style={styles.countRow}>
            <View style={styles.countInput}>
              <FormField
                label="Purchase Date"
                optional
                value={purchaseDateText}
                onChangeText={setPurchaseDateText}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.countInput}>
              <FormField
                label="Expiry Date"
                optional
                value={expiryDateText}
                onChangeText={setExpiryDateText}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Anything worth remembering about this feed"
          />

          <NotificationPreviewCard
            rows={[
              {
                key: 'feed-expiry',
                label: 'Expiry Reminder',
                scheduledDate: previewIsPast ? null : previewScheduledDate,
                disabledReason: previewDisabledReason,
                testTitle: `${form.name.trim() || 'This feed'} is expiring soon`,
                testBody: previewExpiryDate ? `This feed expires on ${previewExpiryDate}.` : 'This feed is expiring soon.',
                categoryIdentifier: NOTIFICATION_CATEGORIES.feed,
                testData: { type: 'feedItem', category: 'Feed Alert', feedItemId: itemId ?? 0 },
              },
            ]}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Feed'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
        disabled={saving}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeItem: {
    width: '31%',
  },
  countRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  countInput: {
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
});
