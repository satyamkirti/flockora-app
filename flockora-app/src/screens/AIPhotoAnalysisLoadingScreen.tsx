import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, BirdPhotoBadge, FadeInUp } from '../components';
import { aiAnalysisStatusMessages, getMockAIAnalysis, speciesByKey } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AIPhotoAnalysisLoading'>;

const STEP_INTERVAL_MS = 650;

export function AIPhotoAnalysisLoadingScreen({ navigation }: Props) {
  const { speciesKey, updateBird } = useOnboarding();
  const species = speciesByKey(speciesKey ?? 'chicken');
  const spin = useRef(new Animated.Value(0)).current;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setMessageIndex((current) => Math.min(current + 1, aiAnalysisStatusMessages.length - 1));
    }, STEP_INTERVAL_MS);

    const finishTimer = setTimeout(() => {
      updateBird({ aiAnalysis: getMockAIAnalysis(speciesKey ?? 'chicken') });
      navigation.replace('ReviewConfirmBirdDetails');
    }, STEP_INTERVAL_MS * aiAnalysisStatusMessages.length + 300);

    return () => {
      clearInterval(stepTimer);
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
          <BirdPhotoBadge icon={species.icon} size={104} style={styles.badge} />
        </View>

        <FadeInUp>
          <AppText variant="screenTitle" align="center" style={styles.title}>
            Analyzing photo
          </AppText>
        </FadeInUp>

        <AppText variant="body" color={colors.secondaryText} align="center" style={styles.message}>
          {aiAnalysisStatusMessages[messageIndex]}
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrap: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: colors.softGreen,
    borderTopColor: colors.sunflowerYellow,
    borderRightColor: colors.leafGreen,
  },
  badge: {
    marginBottom: 0,
  },
  title: {
    marginBottom: spacing.sm,
  },
  message: {
    minHeight: 22,
  },
});
