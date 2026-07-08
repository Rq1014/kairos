import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/client';
import { getMe } from '@/api/user';
import { refreshAuth } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useThemeStore } from '@/store/themeStore';
import { useAttemptStore } from '@/store/attemptStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useBrowseSchoolsStore } from '@/store/browseSchoolsStore';
import { useDictStore } from '@/store/dictStore';
import { useColors } from '@/constants/colors';

useOnboardingStore.getState().setOnboardingDone();
useThemeStore.getState().hydrate();
useAttemptStore.getState().hydrate();
useFavoritesStore.getState().hydrate();
useBrowseSchoolsStore.getState().hydrate();
useDictStore.getState().hydrate();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 0,
      networkMode: 'offlineFirst',
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: { networkMode: 'offlineFirst', retry: 0 },
  },
});

async function bootstrapAuth() {
  const { setHydrated, setAuthTokens, setUser, clearAuth } = useAuthStore.getState();

  let token: string | null = null;
  let refreshToken: string | null = null;
  try {
    [token, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY).catch(() => null),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null),
    ]);
  } catch {
    // ignore
  }

  if (!token && !refreshToken) {
    setHydrated();
    return;
  }

  // 把现有 token 灌入 zustand,使首次 getMe() 已能携带 Authorization。
  setAuthTokens(token, refreshToken);

  try {
    const me = await getMe();
    // getMe 走 apiRequest,响应头里的 X-New-Access-Token 已被 client 拦截写回。
    // 这里以 zustand 当前 token 为准(可能已被滑动续签更新)。
    const latest = useAuthStore.getState();
    setUser(me, latest.token ?? token ?? '', latest.refreshToken ?? refreshToken);
  } catch {
    // access 失效:用 refresh 兜底
    if (refreshToken) {
      try {
        const result = await refreshAuth(refreshToken);
        await Promise.all([
          SecureStore.setItemAsync(TOKEN_KEY, result.accessToken).catch(() => {}),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken).catch(() => {}),
        ]);
        setUser(result.user, result.accessToken, result.refreshToken);
      } catch {
        await Promise.all([
          SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
        ]);
        clearAuth();
      }
    } else {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
      ]);
      clearAuth();
    }
  } finally {
    setHydrated();
  }
}

bootstrapAuth();

function RootLayoutNav() {
  const Colors = useColors();
  const mode = useThemeStore((s) => s.mode);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"               options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)"              options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding"          options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="questions/[id]"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="wrong-book"          options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="topic-study"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="topic-questions"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="mock-exam"           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="exam-session"        options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        <Stack.Screen name="exam-papers"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="history"             options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="favorites"           options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="reference-index"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="search"              options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ai-chat"             options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings"            options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="paywall"             options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="billing"             options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications"       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="upload-contribution" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="edit-profile"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account-security"               options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account-security/email"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account-security/phone"         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account-security/third-party"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account-security/password"      options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="university/[id]"     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="professor/[name]"    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="forum/[id]"          options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="forum/compose"       options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="groups/index"        options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="groups/[id]"         options={{ animation: 'slide_from_right' }} />
      </Stack>
      {!isHydrated && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: Colors.background }]}>
          <ActivityIndicator color={Colors.blue500} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: { alignItems: 'center', justifyContent: 'center' },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
