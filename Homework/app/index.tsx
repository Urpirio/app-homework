import api from '@/utils/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');

        if (!token) {
          router.replace('/login');
          return;
        }

        // Token exists — validate it (the API interceptor handles refresh automatically)
        const { data } = await api.get('/auth/profile');

        if (data.role === 'SUPPORT') {
          router.replace('/support/dashboard');
        } else {
          router.replace('/(tabs)/home');
        }
      } catch {
        // Token expired/invalid and refresh also failed → go to login
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        router.replace('/login');
      } finally {
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  return <View style={{ flex: 1 }} />;
}
