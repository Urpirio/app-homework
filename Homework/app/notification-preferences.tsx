/**
 * Notification Preferences Screen
 *
 * Settings screen with toggle switches for each notification preference category.
 * Fetches current preferences on mount, updates via PUT on toggle change with
 * optimistic UI updates.
 *
 * Validates: Requirements 5.5
 * Design: Notification Deep Linking Design — Notification Preferences
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import {
    useNotificationPreferences,
    useUpdateNotificationPreferences,
} from '@/hooks/api/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import type { NotificationPreferences } from '@/types/notification';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PreferenceItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: string;
}

const PREFERENCE_ITEMS: PreferenceItem[] = [
  {
    key: 'assignments',
    label: 'Tareas',
    description: 'Nuevas tareas y actividades asignadas',
    icon: 'document-text-outline',
  },
  {
    key: 'grades',
    label: 'Calificaciones',
    description: 'Resultados y retroalimentación de entregas',
    icon: 'school-outline',
  },
  {
    key: 'messages',
    label: 'Mensajes',
    description: 'Nuevos mensajes en chats',
    icon: 'chatbubble-outline',
  },
  {
    key: 'system',
    label: 'Sistema',
    description: 'Actualizaciones administrativas',
    icon: 'settings-outline',
  },
  {
    key: 'deadlines',
    label: 'Fechas límite',
    description: 'Recordatorios de entregas próximas',
    icon: 'alarm-outline',
  },
  {
    key: 'emailNotifications',
    label: 'Correo electrónico',
    description: 'Recibir notificaciones también por email',
    icon: 'mail-outline',
  },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  assignments: true,
  grades: true,
  messages: true,
  system: true,
  deadlines: true,
  emailNotifications: false,
};

export default function NotificationPreferencesScreen() {
  const { theme } = useTheme();
  const { data: serverPreferences, isLoading, isError, refetch } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (serverPreferences) {
      setLocalPreferences(serverPreferences);
    }
  }, [serverPreferences]);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...localPreferences, [key]: value };
    setLocalPreferences(updated);
    updateMutation.mutate(updated);
  };

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: theme.colors.text }]}>Notificaciones</Text>
              <View style={{ width: 40 }} />
            </View>
          </View>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Cargando preferencias...
            </Text>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: theme.colors.text }]}>Notificaciones</Text>
              <View style={{ width: 40 }} />
            </View>
          </View>
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
              Error al cargar preferencias
            </Text>
            <Text style={[styles.errorDescription, { color: theme.colors.textSecondary }]}>
              No se pudieron obtener tus preferencias de notificación.
            </Text>
            <Pressable
              onPress={() => refetch()}
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: theme.colors.text }]}>Notificaciones</Text>
              <View style={{ width: 40 }} />
            </View>

            <Animated.View entering={FadeInDown.duration(800)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Preferencias de Notificación
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                Configura qué tipos de notificaciones deseas recibir.
              </Text>

              {PREFERENCE_ITEMS.map((item) => (
                <PreferenceToggle
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  value={localPreferences[item.key]}
                  onToggle={(value: boolean) => handleToggle(item.key, value)}
                />
              ))}
            </Animated.View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

function PreferenceToggle({
  icon,
  label,
  description,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.toggleItem}>
      <View style={[styles.toggleIcon, { backgroundColor: theme.colors.card }]}>
        <Ionicons name={icon as any} size={22} color={theme.colors.text} />
      </View>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  errorDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
