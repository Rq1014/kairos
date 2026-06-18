import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'kakomon_onboarding_done';

interface OnboardingState {
  hasSeenOnboarding: boolean | null;
  setOnboardingDone: () => void;
  hydrateOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: null,

  setOnboardingDone: () => {
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
    set({ hasSeenOnboarding: true });
  },

  hydrateOnboarding: async () => {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEY);
      set({ hasSeenOnboarding: val === 'true' });
    } catch {
      set({ hasSeenOnboarding: true }); // fail-safe: never block on storage error
    }
  },
}));
