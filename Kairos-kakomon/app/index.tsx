import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore';
import { useColors } from '@/constants/colors';

export default function Index() {
  const Colors = useColors();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (!isHydrated) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.background }]}>
        <ActivityIndicator color={Colors.blue500} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/study' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
