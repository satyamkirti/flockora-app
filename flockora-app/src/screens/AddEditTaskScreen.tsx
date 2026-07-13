import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  SegmentedControl,
  SelectableCard,
  BirdPickerModal,
  FlockManagerModal,
  FadeInUp,
} from '../components';
import { useTask, useBirds, useFlocks } from '../hooks';
import { taskRepository } from '../db/repositories';
import { syncTaskNotification } from '../services/notificationService';
import { taskTypeByKey, taskTypeOptions } from '../data/taskTypes';
import { RepeatType, TaskInput, TaskType, createEmptyTaskInput } from '../types/task';
import { parseDateTimeInputs, toDateInputValue, toTimeInputValue } from '../utils/taskSchedule';
import { TodayStackParamList } from '../navigation/todayTypes';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<TodayStackParamList, 'AddEditTask'>;

const repeatOptions: { label: string; value: RepeatType }[] = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

function nextHalfHour(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  result.setSeconds(0, 0);
  result.setMinutes(minutes < 30 ? 30 : 0, 0, 0);
  if (minutes >= 30) {
    result.setHours(result.getHours() + 1);
  }
  return result;
}

export function AddEditTaskScreen({ route, navigation }: Props) {
  const { taskId } = route.params;
  const isEditing = taskId != null;
  const db = useSQLiteContext();
  const { task: existingTask, loading: loadingTask } = useTask(taskId);
  const { birds } = useBirds();
  const { flocks, refresh: refreshFlocks } = useFlocks();

  const defaultDueDate = nextHalfHour(new Date());
  const [form, setForm] = useState<TaskInput>(() => ({
    ...createEmptyTaskInput(),
    title: taskTypeByKey('feed').label,
  }));
  const [dateText, setDateText] = useState(toDateInputValue(defaultDueDate));
  const [timeText, setTimeText] = useState(toTimeInputValue(defaultDueDate));
  const [birdModalVisible, setBirdModalVisible] = useState(false);
  const [flockModalVisible, setFlockModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);
  const [titleTouched, setTitleTouched] = useState(isEditing);

  const quickDateOptions = React.useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return [
      { label: 'Today', value: toDateInputValue(today) },
      { label: 'Tomorrow', value: toDateInputValue(tomorrow) },
      { label: 'Next Week', value: toDateInputValue(nextWeek) },
    ];
  }, []);

  useEffect(() => {
    if (isEditing && existingTask && !hydrated) {
      setForm({
        birdId: existingTask.birdId,
        flockId: existingTask.flockId,
        type: existingTask.type,
        title: existingTask.title,
        description: existingTask.description,
        dueDate: existingTask.dueDate,
        repeatType: existingTask.repeatType,
        notificationEnabled: existingTask.notificationEnabled,
      });
      const due = new Date(existingTask.dueDate);
      setDateText(toDateInputValue(due));
      setTimeText(toTimeInputValue(due));
      setHydrated(true);
    }
  }, [isEditing, existingTask, hydrated]);

  const update = (patch: Partial<TaskInput>) => setForm((current) => ({ ...current, ...patch }));

  const handleTypeSelect = (key: TaskType) => {
    setForm((current) => ({
      ...current,
      type: key,
      title: !isEditing && !titleTouched ? taskTypeByKey(key).label : current.title,
    }));
  };

  const birdName = birds.find((bird) => bird.id === form.birdId)?.name ?? 'No Bird';
  const flockName = flocks.find((flock) => flock.id === form.flockId)?.name ?? 'No Flock';

  const handleSave = async () => {
    const effectiveTimeText = timeText.trim() || toTimeInputValue(defaultDueDate);
    const dueDate = parseDateTimeInputs(dateText, effectiveTimeText);
    if (!dueDate) {
      Alert.alert('Invalid date or time', 'Please use YYYY-MM-DD for date and HH:MM for time.');
      return;
    }

    const payload: TaskInput = {
      ...form,
      title: form.title.trim() || taskTypeByKey(form.type).label,
      description: form.description?.trim() || null,
      dueDate: dueDate.toISOString(),
    };

    setSaving(true);
    try {
      if (isEditing && taskId != null) {
        const updated = await taskRepository.updateTask(db, taskId, payload);
        const notificationId = await syncTaskNotification(updated, existingTask?.notificationId ?? null);
        await taskRepository.setNotificationId(db, taskId, notificationId);
        if (payload.notificationEnabled && !notificationId) {
          Alert.alert('Notifications are off', 'Enable notifications for Flockora in your device settings to get reminders.');
        }
        navigation.goBack();
      } else {
        const created = await taskRepository.createTask(db, payload);
        const notificationId = await syncTaskNotification(created, null);
        if (notificationId) {
          await taskRepository.setNotificationId(db, created.id, notificationId);
        } else if (payload.notificationEnabled) {
          Alert.alert('Notifications are off', 'Enable notifications for Flockora in your device settings to get reminders.');
        }
        navigation.replace('TaskDetail', { taskId: created.id });
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Could not save this task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingTask && !hydrated) {
    return (
      <AppScreen>
        <ActivityIndicator size="large" color={colors.leafGreen} style={styles.loader} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="sectionTitle">{isEditing ? 'Edit Task' : 'Add Task'}</AppText>
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
              Task Type
            </AppText>
            <View style={styles.typeGrid}>
              {taskTypeOptions.map((option) => (
                <View key={option.key} style={styles.typeItem}>
                  <SelectableCard
                    icon={option.icon}
                    label={option.label}
                    selected={form.type === option.key}
                    onPress={() => handleTypeSelect(option.key)}
                  />
                </View>
              ))}
            </View>
          </FadeInUp>

          <FormField
            label="Title"
            optional
            value={form.title}
            onChangeText={(text) => {
              setTitleTouched(true);
              update({ title: text });
            }}
            placeholder="e.g. Give Daisy her medicine"
          />

          <FormField
            label="Description"
            optional
            multiline
            value={form.description ?? ''}
            onChangeText={(text) => update({ description: text })}
            placeholder="Any extra detail worth remembering"
          />

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Bird
            </AppText>
            <Pressable style={styles.pickerField} onPress={() => setBirdModalVisible(true)}>
              <AppText variant="body">{birdName}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

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
              Due Date
            </AppText>
            <View style={styles.quickDateRow}>
              {quickDateOptions.map((option) => {
                const selected = dateText === option.value;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setDateText(option.value)}
                    style={[styles.quickDateChip, selected && styles.quickDateChipSelected]}
                  >
                    <AppText variant="caption" color={selected ? colors.cardSurface : colors.primaryText}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <FormField label="Date" value={dateText} onChangeText={setDateText} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.timeInput}>
              <FormField label="Time" optional value={timeText} onChangeText={setTimeText} placeholder="HH:MM" />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <AppText variant="cardTitle" style={styles.label}>
              Repeat
            </AppText>
            <SegmentedControl
              options={repeatOptions}
              value={form.repeatType}
              onChange={(value) => update({ repeatType: value })}
            />
          </View>

          <View style={styles.notificationRow}>
            <View style={styles.notificationText}>
              <AppText variant="cardTitle">Reminder Notification</AppText>
              <AppText variant="caption" color={colors.secondaryText}>
                Get a local reminder at the due time
              </AppText>
            </View>
            <Switch
              value={form.notificationEnabled}
              onValueChange={(value) => update({ notificationEnabled: value })}
              trackColor={{ false: colors.border, true: colors.leafGreen }}
              thumbColor={colors.cardSurface}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PrimaryButton
        label={saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Task'}
        onPress={handleSave}
        style={saving ? styles.disabled : undefined}
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeItem: {
    width: '31%',
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
  quickDateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickDateChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickDateChipSelected: {
    backgroundColor: colors.leafGreen,
    borderColor: colors.leafGreen,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  timeInput: {
    width: 120,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  notificationText: {
    flex: 1,
    marginRight: spacing.md,
  },
  disabled: {
    opacity: 0.6,
  },
});
