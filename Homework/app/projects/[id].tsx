import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { TaskItem } from '@/components/home/TaskItem';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Project, Task } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TaskModal } from '@/components/login/TaskModal';
import { ProjectActionsModal } from '@/components/login/ProjectActionsModal';
import { ProjectModal } from '@/components/login/ProjectModal';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching project:', error);
      Alert.alert('Error', 'No se pudo cargar la información del proyecto.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const handleSaveTask = async (data: any) => {
    try {
      if (editingTask) {
        const response = await api.patch(`/tasks/${editingTask.id}`, data);
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...response.data } : t));
      } else {
        const response = await api.post('/tasks', {
          ...data,
          projectId: id,
        });
        setTasks([response.data, ...tasks]);
      }
      setTaskModalVisible(false);
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'No se pudo guardar la tarea.');
    }
  };

  const handleSaveProject = async (data: any) => {
    try {
      const response = await api.patch(`/projects/${id}`, data);
      setProject(response.data);
      setProjectModalVisible(false);
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Error', 'No se pudo actualizar el proyecto.');
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/projects/${id}`);
      router.replace('/home');
    } catch (error) {
      console.error('Error deleting project:', error);
      Alert.alert('Error', 'No se pudo eliminar el proyecto.');
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      const response = await api.patch(`/tasks/${task.id}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: response.data.status } : t));
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

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
              <Pressable 
                onPress={() => setActionsVisible(true)} 
                style={styles.moreButton}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {loading || !project ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                <Animated.View entering={FadeInDown.duration(800)}>
                  <View style={[styles.colorLabel, { backgroundColor: project.color }]} />
                  <Text style={[styles.title, { color: theme.colors.text }]}>
                    {project.name}
                  </Text>
                  <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                    {project.description}
                  </Text>

                  <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                      <Text style={[styles.progressLabel, { color: theme.colors.text }]}>Progreso</Text>
                      <Text style={[styles.progressValue, { color: theme.colors.text }]}>
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status.toLowerCase() === 'done').length / tasks.length) * 100) : 0}%
                      </Text>
                    </View>
                    <View style={[styles.progressBarBase, { backgroundColor: theme.colors.border }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            backgroundColor: project.color, 
                            width: `${tasks.length > 0 ? (tasks.filter(t => t.status.toLowerCase() === 'done').length / tasks.length) * 100 : 0}%` 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </Animated.View>

                <View style={styles.tasksSection}>
                  <View style={styles.tasksHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Tareas
                    </Text>
                    <View style={[styles.taskCount, { backgroundColor: theme.colors.primaryLight }]}>
                      <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                        {tasks.length}
                      </Text>
                    </View>
                  </View>

                  {tasks.length > 0 ? (
                    tasks.map((task, index) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        index={index} 
                        onToggle={() => toggleTaskStatus(task)}
                        onPress={() => {
                          setEditingTask(task);
                          setTaskModalVisible(true);
                        }}
                      />
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No hay tareas en este proyecto.
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <Pressable 
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => { setEditingTask(null); setTaskModalVisible(true); }}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Pressable>

        {/* Modales */}
        <TaskModal 
          visible={taskModalVisible} 
          onClose={() => setTaskModalVisible(false)} 
          onSave={handleSaveTask}
          initialData={editingTask}
        />

        <ProjectModal 
          visible={projectModalVisible}
          onClose={() => setProjectModalVisible(false)}
          onSave={handleSaveProject}
          initialData={project}
        />

        <ConfirmModal 
          visible={confirmDeleteVisible}
          onClose={() => setConfirmDeleteVisible(false)}
          onConfirm={handleDeleteConfirmed}
          title="Eliminar Proyecto"
          message="¿Estás seguro de que deseas eliminar este proyecto? Se borrarán todas las tareas asociadas."
          isDestructive={true}
          confirmLabel="Eliminar"
        />

        <ProjectActionsModal 
          visible={actionsVisible} 
          onClose={() => setActionsVisible(false)} 
          onDelete={() => setConfirmDeleteVisible(true)}
          onEdit={() => setProjectModalVisible(true)}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  moreButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  colorLabel: {
    width: 60,
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  progressSection: {
    marginBottom: 32,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarBase: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  tasksSection: {
    marginBottom: 100,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  taskCount: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
