import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

function expoPackagerOrigin(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    '';
  if (typeof hostUri === 'string' && hostUri.includes(':')) {
    // hostUri = "192.168.40.28:8081"
    return `http://${hostUri}`;
  }
  if (typeof hostUri === 'string' && hostUri.length > 0) {
    return `http://${hostUri}:8081`;
  }
  return '';
}

/**
 * Pagos van por Metro /mp-api → backend :4000
 * (el celular ya puede hablar con 8081; el 4000 suele estar bloqueado).
 */
function resolveBackendUrl(): string {
  const packager = expoPackagerOrigin();
  if (packager) return `${packager}/mp-api`;

  const configured =
    extra.BACKEND_URL ?? process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:8081/mp-api';
}

export const ENV = {
  USE_MOCK: (extra.USE_MOCK ?? process.env.EXPO_PUBLIC_USE_MOCK ?? 'true') === 'true',
  FIREBASE_API_KEY: extra.FIREBASE_API_KEY ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  FIREBASE_AUTH_DOMAIN:
    extra.FIREBASE_AUTH_DOMAIN ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  FIREBASE_PROJECT_ID:
    extra.FIREBASE_PROJECT_ID ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  FIREBASE_STORAGE_BUCKET:
    extra.FIREBASE_STORAGE_BUCKET ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  FIREBASE_MESSAGING_SENDER_ID:
    extra.FIREBASE_MESSAGING_SENDER_ID ??
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    '',
  FIREBASE_APP_ID: extra.FIREBASE_APP_ID ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  GOOGLE_MAPS_API_KEY:
    extra.GOOGLE_MAPS_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  BACKEND_URL: resolveBackendUrl(),
  CLOUDINARY_CLOUD_NAME:
    extra.CLOUDINARY_CLOUD_NAME ?? process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_UPLOAD_PRESET:
    extra.CLOUDINARY_UPLOAD_PRESET ?? process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '',
};
