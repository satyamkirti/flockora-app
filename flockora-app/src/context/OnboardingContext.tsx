import React, { createContext, useContext, useMemo, useState } from 'react';
import { BirdDraft, PurposeKey, SpeciesKey, createEmptyBirdDraft } from '../types/onboarding';

type OnboardingContextValue = {
  speciesKey: SpeciesKey | null;
  purposes: PurposeKey[];
  bird: BirdDraft;
  setSpecies: (key: SpeciesKey) => void;
  togglePurpose: (key: PurposeKey) => void;
  updateBird: (patch: Partial<BirdDraft>) => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [speciesKey, setSpeciesKey] = useState<SpeciesKey | null>(null);
  const [purposes, setPurposes] = useState<PurposeKey[]>([]);
  const [bird, setBird] = useState<BirdDraft>(createEmptyBirdDraft());

  const value = useMemo<OnboardingContextValue>(
    () => ({
      speciesKey,
      purposes,
      bird,
      setSpecies: (key) => setSpeciesKey(key),
      togglePurpose: (key) =>
        setPurposes((current) =>
          current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
        ),
      updateBird: (patch) => setBird((current) => ({ ...current, ...patch })),
      resetOnboarding: () => {
        setSpeciesKey(null);
        setPurposes([]);
        setBird(createEmptyBirdDraft());
      },
    }),
    [speciesKey, purposes, bird]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
