import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { TaskItem } from '@/components/home/TaskItem';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_UNIT_TASKS: Record<string, any[]> = {
  'u1': [
    { id: 't1', title: 'Guía de identidades trigonométricas', status: 'done', createdAt: new Date().toISOString() },
    { id: 't2', title: 'Examen de límites', status: 'todo', createdAt: new Date().toISOString() },
  ],
  'u2': [
    { id: 't3', title: 'Proyecto: Aplicaciones del cálculo', status: 'todo', createdAt: new Date().toISOString() },
  ],
  'h1': [
    { id: 't4', title: 'Ensayo sobre la Revolución Francesa', status: 'todo', createdAt: new Date().toISOString() },
  ],
  'h2': [
    { id: 't5', title: 'Línea de tiempo: Primera Guerra Mundial', status: 'done', createdAt: new Date().toISOString() },
  ]
};

export default function UnitTasksScreen() {
  const { id, unitId, unitName } = useLocalSearchParams();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      if (typeof unitId === 'string' && MOCK_UNIT_TASKS[unitId]) {
        setTasks(MOCK_UNIT_TASKS[unitId]);
        setLoading(false);
        return;
      }
      // En un caso real, buscaríamos las tareas de la unidad vía API
      const response = await api.get(`/units/${unitId}/tasks`);
      setTasks(response.data);
    } catch (error) {
      setTasks(MOCK_UNIT_TASKS['u1'] || []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [unitId])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Tareas de la Unidad</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{unitName || 'Unidad'}</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item, index }) => (
                <TaskItem 
                  task={item} 
                  index={index} 
                  onToggle={() => {}} // El toggle se maneja en el detalle ahora
                  onPress={() => router.push(`/tasks/${item.id}`)}
                />
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No hay tareas en esta unidad.</Text>
              }
            />
          )}
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerText: { marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
});
