import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TaskListScreen() {
  const { id, classId, subjectId } = useLocalSearchParams<{ id: string, classId: string, subjectId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [subjectId]);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/subjects/${subjectId}/tasks`);
      setTasks(res.data);
    } catch (error) {
      // Mock data
      setTasks([
        { id: 't1', title: 'Ecuaciones de Segundo Grado', deadline: '2026-05-10', submissions: 12, total: 15 },
        { id: 't2', title: 'Leyes de Newton', deadline: '2026-05-15', submissions: 8, total: 15 },
        { id: 't3', title: 'Ensayo de Relatividad', deadline: '2026-05-20', submissions: 0, total: 15 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>Listado de Tareas</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/task/${item.id}`)}
                style={({ pressed }) => [
                  styles.taskCard,
                  { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View style={[styles.taskIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="clipboard" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
                  <Text style={[styles.taskDeadline, { color: theme.colors.textSecondary }]}>
                    Fecha límite: {item.deadline}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.border + '30' }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            backgroundColor: theme.colors.primary, 
                            width: `${(item.submissions / item.total) * 100}%` 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                      {item.submissions}/{item.total} entregas
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
              </Pressable>
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  listContent: { padding: 20 },
  taskCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  taskIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  taskDeadline: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 70,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
