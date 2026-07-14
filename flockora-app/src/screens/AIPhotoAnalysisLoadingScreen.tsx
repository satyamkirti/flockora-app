import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppScreen, AppText, BirdPhotoBadge, FadeInUp, PrimaryButton, TextButton } from '../components';
import { aiAnalysisStatusMessages, speciesByKey } from '../data/onboardingData';
import { useOnboarding } from '../context/OnboardingContext';
import { analyzeBirdPhoto, BirdAnalysisErrorKind } from '../services/birdAnalysisService';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AIPhotoAnalysisLoading'>;

const STEP_INTERVAL_MS = 650;

type ViewState = { phase: 'loading' } | { phase: 'error'; kind: BirdAnalysisErrorKind; message: string };

export function AIPhotoAnalysisLoadingScreen({ navigation }: Props) {
  const { speciesKey, bird, updateBird } = useOnboarding();
  const species = speciesByKey(speciesKey ?? 'chicken');
  const spin = useRef(new Animated.Value(0)).current;
  const [messageIndex, setMessageIndex] = useState(0);
  const [state, setState] = useState<ViewState>({ phase: 'loading' });

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

  const runAnalysis = useCallback(async () => {
    setState({ phase: 'loading' });
    setMessageIndex(0);

    if (!bird.photo) {
      // Defensive — AddFirstBirdScreen only allows Continue once a photo exists.
      setState({
        phase: 'error',
        kind: 'invalid_image',
        message: 'No photo was found. Please go back and add a photo, or enter details manually.',
      });
      return;
    }

    const outcome = await analyzeBirdPhoto({ photo: bird.photo, speciesHint: speciesKey ?? undefined });

    if (outcome.status === 'success') {
      updateBird({ aiAnalysis: outcome.result });
      navigation.replace('ReviewConfirmBirdDetails');
      return;
    }

    setState({ phase: 'error', kind: outcome.kind, message: outcome.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bird.photo, speciesKey]);

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.phase !== 'loading') {
      return;
    }
    const stepTimer = setInterval(() => {
      setMessageIndex((current) => Math.min(current + 1, aiAnalysisStatusMessages.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(stepTimer);
  }, [state.phase]);

  const handleEnterManually = () => {
    updateBird({ aiAnalysis: null });
    navigation.replace('ReviewConfirmBirdDetails');
  };

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={styles.ringWrap}>
          {state.phase === 'loading' ? (
            <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
          ) : null}
          <BirdPhotoBadge icon={species.icon} size={104} style={styles.badge} />
        </View>

        {state.phase === 'loading' ? (
          <>
            <FadeInUp>
              <AppText variant="screenTitle" align="center" style={styles.title}>
                Analyzing photo
              </AppText>
            </FadeInUp>
            <AppText variant="body" color={colors.secondaryText} align="center" style={styles.message}>
              {aiAnalysisStatusMessages[messageIndex]}
            </AppText>
          </>
        ) : (
          <FadeInUp style={styles.errorBlock}>
            <AppText variant="screenTitle" align="center" style={styles.title}>
              Couldn't analyze that photo
            </AppText>
            <AppText variant="body" color={colors.secondaryText} align="center" style={styles.message}>
              {state.message}
            </AppText>
            <PrimaryButton label="Try Again" onPress={runAnalysis} style={styles.retryButton} />
            <TextButton label="Enter Details Manually" onPress={handleEnterManually} style={styles.manualButton} />
          </FadeInUp>
        )}
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
  errorBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  manualButton: {
    marginTop: spacing.sm,
  },
});
