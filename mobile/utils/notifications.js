import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';

// Expo Go di Android tidak punya modul native untuk remote push (sejak SDK 53),
// dan meng-import expo-notifications di sana langsung error fatal.
// Jadi kita cek dulu apakah modul native-nya ada sebelum memuat library.
function pushDidukung() {
  if (Platform.OS !== 'android') return true;
  return requireOptionalNativeModule('ExpoTopicSubscriptionModule') != null;
}

let cache;

export function getNotifications() {
  if (cache !== undefined) return cache;
  cache = pushDidukung() ? require('expo-notifications') : null;
  return cache;
}

export function aturHandlerNotifikasi() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getExpoPushToken() {
  const Notifications = getNotifications();

  if (!Notifications) {
    throw new Error(
      'Push notification tidak didukung di Expo Go Android. Gunakan development build.'
    );
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    throw new Error('Izin notifikasi tidak diberikan');
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('EAS projectId tidak ditemukan');
  }

  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  return result.data;
}
