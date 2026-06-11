import { HomeSchoolAdmin } from '@/components/home/roles/HomeSchoolAdmin';
import { HomeSuperAdmin } from '@/components/home/roles/HomeSuperAdmin';
import { HomeStudent } from '@/components/home/roles/HomeStudent';
import { HomeTeacher } from '@/components/home/roles/HomeTeacher';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const { data: profile } = await api.get('/auth/profile');
          if (profile.role === 'SUPPORT') {
            router.replace('/support/dashboard');
            return;
          }
          setUser(profile);
        } catch {
          // keep null
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderHome = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':  return <HomeSuperAdmin user={user} />;
      case 'SCHOOL_ADMIN': return <HomeSchoolAdmin user={user} />;
      case 'TEACHER':      return <HomeTeacher user={user} />;
      default:             return <HomeStudent user={user} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        <BackgroundShapes />
        {renderHome()}
      </ThemedView>
    </SafeAreaView>
  );
}
