/**
 * Notificaciones de solicitudes (PDF §7).
 * Expo Go: expo-notifications.
 * Development build / EAS: @react-native-firebase/messaging (opcional).
 * AI-assisted: see docs/AI_LOG.md #4
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  // Intentamos FCM nativo fuera de Expo Go
  if (Constants.appOwnership !== 'expo') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const messaging = require('@react-native-firebase/messaging').default;
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        const token = await messaging().getToken();
        console.log('FCM token', token?.slice?.(0, 12));
        return true;
      }
    } catch {
      // Sin módulo nativo → fallback
    }
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function notifyIncomingTrip(summary: string) {
  const ok = await ensureNotificationPermission();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nueva solicitud de viaje',
      body: summary,
    },
    trigger: null,
  });
}
