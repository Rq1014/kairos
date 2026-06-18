import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;

  setUser: (user: UserProfile, token: string, refreshToken?: string | null) => void;
  setAuthTokens: (token: string | null, refreshToken?: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isHydrated: false,

  setUser: (user, token, refreshToken = null) => set({ user, token, refreshToken, isLoading: false }),
  setAuthTokens: (token, refreshToken = null) => set({ token, refreshToken }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, token: null, refreshToken: null, isLoading: false }),
  setHydrated: () => set({ isHydrated: true }),
}));

export const selectIsAuthenticated = (s: AuthState) => s.user !== null && s.token !== null;
export const selectIsPro = (s: AuthState) => s.user?.isPro ?? false;
export const selectAiQuotaRemaining = (s: AuthState) => s.user?.freeAiRemaining ?? 0;
