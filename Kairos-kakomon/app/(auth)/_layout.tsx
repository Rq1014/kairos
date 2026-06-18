import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore';

const ONBOARD_PATH = '/(auth)/onboard-profile';

function AuthStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboard-profile" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function AuthLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const onboardingCompleted = useAuthStore((s) => s.user?.onboardingCompleted);
  const pathname = usePathname();

  if (!isHydrated) {
    return <AuthStack />;
  }

  // 已登录 & 已完成资料 → 跳出 auth 组进入主页
  if (isAuthenticated && onboardingCompleted !== false) {
    return <Redirect href="/(tabs)/study" />;
  }

  // 已登录但未完成资料,且当前不在 onboard-profile,强制跳到 onboard-profile
  if (isAuthenticated && onboardingCompleted === false && !pathname.endsWith('onboard-profile')) {
    return <Redirect href={ONBOARD_PATH as any} />;
  }

  return <AuthStack />;
}
