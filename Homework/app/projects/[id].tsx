import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { TaskItem } from '@/components/home/TaskItem';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Project, Task } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { TaskModal } from '@/components/login/TaskModal';
import { ProjectActionsModal } from '@/components/login/ProjectActionsModal';
import { TaskActionsModal } from '@/components/login/TaskActionsModal';
import { ProjectModal } from '@/components/login/ProjectModal';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { AddCollaboratorModal } from '@/components/login/AddCollaboratorModal';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  
  // Task actions states
  const [taskActionsVisible, setTaskActionsVisible] = useState(false);
  const [confirmDeleteTaskVisible, setConfirmDeleteTaskVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectCollaborators, setProjectCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCollabModalVisible, setAddCollabModalVisible] = useState(false);
  

  const fetchProjectData = async () => {
    if (!project) setLoading(true);
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
      setTasks(response.data.tasks || []);
      // El backend ahora devuelve miembros en la respuesta del proyecto
      if (response.data.members) {
        setProjectCollaborators(
          response.data.members.map((m: any) => ({
            id: m.user.id,
            name: m.user.fullName,
            avatar: m.user.avatarUrl,
            role: m.role,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      Alert.alert('Error', 'No se pudo cargar la información del proyecto.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProjectData();
    }, [id])
  );

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

  const handleAddCollaborator = async (collaborator: any) => {
    try {
      await api.post(`/projects/${id}/members`, {
        memberId: collaborator.id
      });
      
      Toast.show({
        type: 'success',
        text1: 'Colaborador añadido',
        text2: `${collaborator.name} ahora es parte del proyecto.`,
      });
      
      setAddCollabModalVisible(false);
      fetchProjectData();
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      const msg = error?.response?.data?.message || 'No se pudo añadir al colaborador.';
      Alert.alert('Error', msg);
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
  
  const handleDeleteTaskConfirmed = async () => {
    if (selectedTask) {
      try {
        await api.delete(`/tasks/${selectedTask.id}`);
        setTasks(tasks.filter(t => t.id !== selectedTask.id));
        setConfirmDeleteTaskVisible(false);
        setSelectedTask(null);
      } catch (error) {
        console.error('Error deleting task:', error);
        Alert.alert('Error', 'No se pudo eliminar la tarea.');
      }
    }
  };

  const handleLongPressTask = (task: Task) => {
    setSelectedTask(task);
    setTaskActionsVisible(true);
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const isDone = task.status?.toLowerCase() === 'done';
      const newStatus = isDone ? 'todo' : 'done';
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
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status?.toLowerCase() === 'done').length / tasks.length) * 100) : 0}%
                      </Text>
                    </View>
                    <View style={[styles.progressBarBase, { backgroundColor: theme.colors.border }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            backgroundColor: project.color, 
                            width: `${tasks.length > 0 ? (tasks.filter(t => t.status?.toLowerCase() === 'done').length / tasks.length) * 100 : 0}%` 
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  {/* Sección de Miembros del Equipo */}
                  <View style={styles.membersSection}>
                    <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Miembros del Equipo</Text>
                    <View style={styles.membersList}>
                      {projectCollaborators.map((member, index) => (
                        <View 
                          key={member.id} 
                          style={[
                            styles.memberAvatarContainer, 
                            { 
                              marginLeft: index === 0 ? 0 : -12,
                              zIndex: 100 - index
                            }
                          ]}
                        >
                          <View style={[styles.memberAvatar, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.background }]}>
                            {member.avatar ? (
                              <Image source={{ uri: member.avatar }} style={styles.memberAvatarImg} />
                            ) : (
                              <Text style={[styles.memberAvatarText, { color: theme.colors.primary }]}>
                                {member.name?.charAt(0)}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                      <TouchableOpacity 
                        style={[styles.addMemberBtn, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.background }]}
                        onPress={() => setAddCollabModalVisible(true)}
                      >
                        <Ionicons name="add" size={20} color={theme.colors.primary} />
                      </TouchableOpacity>
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

                    {(() => {
                      const sortedTasks = [...tasks].sort((a, b) => {
                        const aDone = a.status?.toLowerCase() === 'done';
                        const bDone = b.status?.toLowerCase() === 'done';
                        if (aDone && !bDone) return 1;
                        if (!aDone && bDone) return -1;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      });

                      return sortedTasks.length > 0 ? (
                        sortedTasks.map((task, index) => (
                          <TaskItem 
                            key={task.id} 
                            task={task} 
                            index={index} 
                            onToggle={() => toggleTaskStatus(task)}
                            onPress={() => {
                              setEditingTask(task);
                              setTaskModalVisible(true);
                            }}
                            onLongPress={() => handleLongPressTask(task)}
                          />
                        ))
                      ) : (
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                          No hay tareas en este proyecto.
                        </Text>
                      );
                    })()}
                  </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Simple FAB for New Task */}
        <TouchableOpacity 
          style={[styles.mainFab, { backgroundColor: theme.colors.primary, position: 'absolute', bottom: 30, right: 30 }]}
          onPress={() => {
            setEditingTask(null);
            setTaskModalVisible(true);
          }}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>

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
          onViewCollaborators={() => {
            router.push({
              pathname: '/(tabs)/collaborators',
              params: { projectId: id }
            });
          }}
        />
        
        <TaskActionsModal
          visible={taskActionsVisible}
          onClose={() => setTaskActionsVisible(false)}
          onEdit={() => {
            setEditingTask(selectedTask);
            setTaskModalVisible(true);
          }}
          onDelete={() => setConfirmDeleteTaskVisible(true)}
          taskTitle={selectedTask?.title}
        />

        <ConfirmModal 
          visible={confirmDeleteTaskVisible}
          onClose={() => setConfirmDeleteTaskVisible(false)}
          onConfirm={handleDeleteTaskConfirmed}
          title="Eliminar Tarea"
          message={`¿Estás seguro de que deseas eliminar la tarea "${selectedTask?.title}"?`}
          isDestructive={true}
          confirmLabel="Eliminar"
        />

        <AddCollaboratorModal
          visible={addCollabModalVisible}
          onClose={() => setAddCollabModalVisible(false)}
          onSelect={(col: any) => handleAddCollaborator(col)}
          currentCollaborators={projectCollaborators}
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
  membersSection: {
    marginBottom: 32,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  membersList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  memberAvatarImg: {
    width: '100%',
    height: '100%',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  addMemberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  mainFab: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
