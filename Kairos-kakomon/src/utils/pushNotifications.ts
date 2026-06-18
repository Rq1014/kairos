import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Must be called at module level — controls how notifications are presented
// while the app is in the foreground. Without this, foreground alerts are suppressed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Returns the Expo push token string, or null if unavailable (simulator / denied / no network).
// Call this once after login and send the token to the backend via POST /users/me/push-token.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    // Simulator, missing google-services, or permission denied — degrade gracefully
    return null;
  }
}
