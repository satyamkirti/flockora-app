import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import {
  AppScreen,
  AppText,
  PrimaryButton,
  IconButton,
  FormField,
  FeedItemPickerModal,
  BirdPickerModal,
  FlockManagerModal,
  FadeInUp,
} from '../components';
import { useFeedLog, useFeedItems, useBirds, useFlocks } from '../hooks';
import { feedRepository, InsufficientStockError } from '../db/repositories';
import { notifyLowStock, notifyOutOfStock } from '../services/notificationService';
import { getFeedStockState } from '../utils/feedStock';
import { toDateInputValue } from '../utils/taskSchedule';
import { FeedLogInput, createEmptyFeedLogInput } from '../types/feed';
import { isValidDateString } from '../utils/formValidation';
import { FlockStackParamList } from '../navigation/flockTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<FlockStackParamList, 'LogFeedUsage'>;

export function LogFeedUsageScreen({ route, navigation }: Props) {
  const { feedItemId: routeFeedItemId, logId } = route.params;
  const isEditing = logId != null;
  const db = useSQLiteContext();
  const { log: existingLog, loading: loadingLog } = useFeedLog(logId);
  const { items } = useFeedItems();
  const { birds } = useBirds();
  const { flocks, refresh: refreshFlocks } = useFlocks();

  const [form, setForm] = useState<FeedLogInput>(() => createEmptyFeedLogInput(routeFeedItemId ?? 0, ''));
  const [quantityText, setQuantityText] = useState('0');
  const [dateText, setDateText] = useState(toDateInputValue(new Date()));
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [birdModalVisible, setBirdModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);

  useEffect(() => {
    if (isEditing && existingLog && !hydrated) {
      setForm({
        feedItemId: existingLog.feedItemId,
        flockId: existingLog.flockId,
        birdId: existingLog.birdId,
        quantityUsed: existingLog.quantityUsed,
        unit: existingLog.unit,
        date: existingLog.date,
        notes: existingLog.notes,
      });
      setQuantityText(String(existingLog.quantityUsed));
      setDateText(existingLog.date);
      setHydrated(true);
    }
  }, [isEditing, existingLog, hydrated]);

  const update = (patch: Partial<FeedLogInput>) => setForm((current) => ({ ...current, ...patch }));

  const selectedFeedItem = items.find((item) => item.id === form.feedItemId) ?? null;
  const flockName = flocks.find((flock) => flock.id === form.flockId)?.name ?? 'No Flock';
  const birdName = birds.find((bird) => bird.id === form.birdId)?.name ?? 'No Bird';

  const handleSelectFeed = (feedItemId: number) => {
    const feedItem = items.find((item) => item.id === feedItemId);
    update({ feedItemId, unit: feedItem?.unit ?? form.unit });
  };

  const handleSave = async () => {
    if (!form.feedItemId || !selectedFeedItem) {
      Alert.alert('Feed required', 'Please select which feed was used.');
      return;
    }
    const quantityUsed = Number(quantityText);
    if (!Number.isFinite(quantityUsed) || quantityUsed <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a quantity used greater than zero.');
      return;
    }
    if (!isValidDateString(dateText.trim())) {
      Alert.alert('Invalid date', 'Please use YYYY-MM-DD for the date.');
      return;
    }

    const payload: FeedLogInput = {
      ...form,
      quantityUsed,
      unit: selectedFeedItem.unit,
      date: dateText.trim(),
      notes: form.notes?.trim() || null,
    };

    const beforeItem = selectedFeedItem;

    setSaving(true);
    try {
      if (isEditing && logId != null) {
        await feedRepository.updateFeedLog(db, logId, payload);
      } else {
        await feedRepository.addFeedLog(db, payload);
      }

      const afterItem = await feedRepository.getFeedItem(db, payload.feedItemId);
      if (afterItem) {
        const beforeState = getFeedStockState(beforeItem);
        const afterState = getFeedStockState(afterItem);
        if (beforeState !== 'out' && afterState === 'out') {
          await notifyOutOfStock(afterItem);
        } else if (beforeState !== 'low' && afterState === 'low') {
          await notifyLowStock(afterItem);
        }
      }

      navigation.goBack();
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        Alert.alert('Not enough stock', error.message);
      } else {
        Alert.alert('Something went wrong', 'Could not save this feed log. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingLog && !hydrated) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <AppText variant="sectionTitle">{isEditing ? 'Edit Feed Log' : 'Log Feed Usage'}</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <FadeInUp style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Feed
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setFeedModalVisible(true)}>
              <AppText variant="body">{selectedFeedItem?.name ?? 'Select a feed'}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </FadeInUp>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Flock
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setFlockModalVisible(true)}>
              <AppText variant="body">{flockName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Bird
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setBirdModalVisible(true)}>
              <AppText variant="body">{birdName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <FormField
            label={`Quantity Used${selectedFeedItem ? ` (${selectedFeedItem.unit})` : ''}`}
            value={quantityText}
            onChangeText={setQuantityText}
            placeholder="0"
            keyboardType="decimal-pad"
          />

          <FormField label="Date" value={dateText} onChangeText={setDateText} placeholder="YYYY-MM-DD" />

          <FormField
            label="Notes"
            optional
            multiline
            value={form.notes ?? ''}
            onChangeText={(text) => update({ notes: text })}
            placeholder="Anything worth remembering"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Log Usage'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
      />

      <FeedItemPickerModal
        visible={feedModalVisible}
        onClose={() => setFeedModalVisible(false)}
        items={items}
        selectedFeedItemId={form.feedItemId || null}
        onSelect={handleSelectFeed}
      />

      <BirdPickerModal
        visible={birdModalVisible}
        onClose={() => setBirdModalVisible(false)}
        birds={birds}
        selectedBirdId={form.birdId}
        onSelect={(birdId) => update({ birdId })}
      />

      <FlockManagerModal
        visible={flockModalVisible}
        onClose={() => setFlockModalVisible(false)}
        flocks={flocks}
        onChanged={refreshFlocks}
        selectable
        selectedFlockId={form.flockId}
        onSelect={(flockId) => update({ flockId })}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerSpacer: {
    width: 44,
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
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
});
