import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ProjectCard } from '@/components/home/ProjectCard';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { ActivityIndicator, Alert } from 'react-native';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  TextInput,
  Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProjectModal } from '@/components/login/ProjectModal';
import { ProjectActionsModal } from '@/components/login/ProjectActionsModal';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProjectListScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  
  // Modals state
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Projects list state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      const mapped = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        progress: 0,
        tasksCount: p._count?.tasks || 0,
        completedTasks: 0,
        lastAccessed: new Date(p.updatedAt).toLocaleDateString(),
        color: p.color || theme.colors.primary,
      }));
      setProjects(mapped);
    } catch (error) {
      console.error('Error fetching projects:', error);
      Alert.alert('Error', 'No se pudieron cargar los proyectos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const handleSaveProject = async (data: any) => {
    try {
      if (selectedProject) {
        // Edit
        const response = await api.patch(`/projects/${selectedProject.id}`, data);
        setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, ...response.data } : p));
      } else {
        // Add
        const response = await api.post('/projects', data);
        setProjects([response.data, ...projects]);
      }
      setProjectModalVisible(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Error', 'No se pudo guardar el proyecto.');
    }
  };

  const handleLongPress = (project: Project) => {
    setSelectedProject(project);
    setActionsVisible(true);
  };

  const handleDeleteConfirmed = async () => {
    if (selectedProject) {
      try {
        await api.delete(`/projects/${selectedProject.id}`);
        setProjects(projects.filter(p => p.id !== selectedProject.id));
        setSelectedProject(null);
        setConfirmDeleteVisible(false);
      } catch (error) {
        console.error('Error deleting project:', error);
        Alert.alert('Error', 'No se pudo eliminar el proyecto.');
      }
    }
  };

  const handleOpenAdd = () => {
    setSelectedProject(null);
    setProjectModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={{ flex: 1, paddingHorizontal: horizontalPadding }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Mis Proyectos
            </Text>
            <Pressable 
              onPress={handleOpenAdd}
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar proyecto..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredProjects}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <ProjectCard 
                  project={item} 
                  index={index} 
                  onLongPress={() => handleLongPress(item)}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                  No se encontraron proyectos.
                </Text>
              }
            />
          )}
        </View>

        {/* Modales */}
        <ProjectModal 
          visible={projectModalVisible}
          onClose={() => setProjectModalVisible(false)}
          onSave={handleSaveProject}
          initialData={selectedProject}
        />

        <ProjectActionsModal 
          visible={actionsVisible}
          onClose={() => setActionsVisible(false)}
          onEdit={() => setProjectModalVisible(true)}
          onDelete={() => setConfirmDeleteVisible(true)}
        />

        <ConfirmModal 
          visible={confirmDeleteVisible}
          onClose={() => setConfirmDeleteVisible(false)}
          onConfirm={handleDeleteConfirmed}
          title="Eliminar Proyecto"
          message={`¿Estás seguro de que deseas eliminar "${selectedProject?.name}"?`}
          isDestructive={true}
          confirmLabel="Eliminar"
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
});
