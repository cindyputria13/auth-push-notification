import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import {
  getNotifications,
  aturHandlerNotifikasi,
} from '../../utils/notifications';

export default function AppLayout() {
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;

    aturHandlerNotifikasi();

    const received = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notifikasi diterima:', notification.request.content);
      }
    );

    const response = Notifications.addNotificationResponseReceivedListener(
      (event) => {
        const screen = event.notification.request.content.data?.screen;
        if (screen === 'profile') {
          router.push('/profile');
        }
      }
    );

    return () => {
      received.remove();
      response.remove();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Beranda' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
    </Stack>
  );
}
