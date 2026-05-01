import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { TaskItem } from '@/components/home/TaskItem';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Project, Task } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ScrollView,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TaskModal } from '@/components/login/TaskModal';
import { ProjectActionsModal } from '@/components/login/ProjectActionsModal';
import { ProjectModal } from '@/components/login/ProjectModal';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

  // State for modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // State for project data (Mocked)
  const [project, setProject] = useState<Project>({
    id: id as string,
    name: 'Rediseño de App Móvil',
    description: 'Este proyecto consiste en renovar completamente la experiencia de usuario y la interfaz visual.',
    progress: 75,
    tasksCount: 4,
    completedTasks: 2,
    lastAccessed: '2024-05-01',
    color: '#007AFF',
  });

  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Definir arquitectura de navegación', description: 'Crear el esquema de navegación usando Expo Router v3', status: 'done', dueDate: 'Hoy' },
    { id: '2', title: 'Diseñar paleta de colores premium', description: 'Usar HSL para colores armoniosos', status: 'done', dueDate: 'Hoy' },
    { id: '3', title: 'Implementar animaciones de entrada', description: 'Usar Reanimated para transiciones suaves', status: 'in-progress', dueDate: 'Mañana' },
    { id: '4', title: 'Configurar Expo Router', status: 'todo', dueDate: 'Próx. Lunes' },
  ]);

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const handleSaveTask = (data: any) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...data } : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(),
        ...data,
      };
      setTasks([...tasks, newTask]);
    }
    setEditingTask(null);
  };

  const handleSaveProject = (data: any) => {
    setProject({ ...project, ...data });
  };

  const handleTaskPress = (task: Task) => {
    setEditingTask(task);
    setTaskModalVisible(true);
  };

  const handleDeleteConfirmed = () => {
    console.log('Project deleted:', id);
    router.replace('/projects');
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
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                  </Text>
                </View>
                <View style={[styles.progressBarBase, { backgroundColor: theme.colors.border }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: project.color, 
                        width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` 
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

              {tasks.map((task, index) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  index={index} 
                  onToggle={() => handleTaskPress(task)}
                />
              ))}
            </View>
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
});
