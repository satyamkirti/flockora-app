import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen, AppText, SectionHeader, StatCard, CareTaskRow, StatusPill, PrimaryButton } from '../components';
import { careTasks, todaySummaryCards } from '../data/mockData';
import { colors, radii, spacing, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export function TodayScreen() {
  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.leafGreen}>
              Welcome back
            </AppText>
            <AppText variant="display">Good morning, Emma</AppText>
            <AppText variant="body" color={colors.secondaryText} style={styles.subtitle}>
              Your flock looks good today.
            </AppText>
          </View>
          <View style={styles.iconBubble}>
            <Ionicons name="sunny" size={24} color={colors.hatchOrange} />
          </View>
        </View>

        <View style={[styles.summaryCard, shadows.card]}>
          <View style={styles.summaryGrid}>
            {todaySummaryCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                accentColor={card.accentColor}
                style={styles.statCard}
              />
            ))}
          </View>
        </View>

        <SectionHeader title="Today's Care" />
        <View style={styles.taskList}>
          {careTasks.map((task) => (
            <CareTaskRow
              key={task.title}
              title={task.title}
              detail={task.detail}
              completed={task.completed}
              urgent={task.urgent}
            />
          ))}
        </View>

        <View style={[styles.pulseCard, shadows.card]}>
          <View style={styles.pulseHeader}>
            <View>
              <AppText variant="sectionTitle">Flock Pulse</AppText>
              <AppText variant="caption" color={colors.secondaryText}>
                Looking stable
              </AppText>
            </View>
            <StatusPill label="Stable" tone="success" />
          </View>
          <AppText variant="body" color={colors.secondaryText} style={styles.pulseText}>
            Egg production and recent care activity are within your normal pattern.
          </AppText>
          <PrimaryButton label="View pulse" style={styles.pulseButton} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 140,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
  },
  taskList: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pulseCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseText: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  pulseButton: {
    alignSelf: 'flex-start',
  },
});
