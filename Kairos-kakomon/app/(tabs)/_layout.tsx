import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore';

export default function TabLayout() {
  const Colors = useColors();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const onboardingCompleted = useAuthStore((s) => s.user?.onboardingCompleted);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isHydrated && isAuthenticated && onboardingCompleted === false) {
    return <Redirect href="/(auth)/onboard-profile" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Spacing.tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.blue500,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.weightMedium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="study/index"
        options={{
          title: '学习',
          tabBarIcon: ({ color, size }) => <Icon name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="university/index"
        options={{
          title: '大学',
          tabBarIcon: ({ color, size }) => <Icon name="graph" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forum/index"
        options={{
          title: '论坛',
          tabBarIcon: ({ color, size }) => <Icon name="forum" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
