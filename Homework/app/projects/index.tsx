import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ProjectCard } from '@/components/home/ProjectCard';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

  // Projects list state (Mocked)
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Rediseño de App Móvil', description: 'Renovación completa de la UI/UX', progress: 75, tasksCount: 20, completedTasks: 15, lastAccessed: '2024-05-01', color: '#007AFF' },
    { id: '2', name: 'Dashboard Administrativo', description: 'Panel de control para gestión de datos', progress: 40, tasksCount: 10, completedTasks: 4, lastAccessed: '2024-04-30', color: '#5856D6' },
    { id: '3', name: 'Campaña de Marketing', description: 'Estrategia para el Q3', progress: 10, tasksCount: 15, completedTasks: 1, lastAccessed: '2024-04-28', color: '#FF9500' },
    { id: '4', name: 'E-commerce Backend', description: 'API para tienda en línea', progress: 90, tasksCount: 50, completedTasks: 45, lastAccessed: '2024-04-25', color: '#34C759' },
    { id: '5', name: 'Research de Mercado', description: 'Análisis de competencia', progress: 25, tasksCount: 8, completedTasks: 2, lastAccessed: '2024-04-20', color: '#FF2D55' },
  ]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const handleSaveProject = (data: any) => {
    if (selectedProject) {
      // Edit
      setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, ...data } : p));
    } else {
      // Add
      const newProject: Project = {
        id: Math.random().toString(),
        progress: 0,
        tasksCount: 0,
        completedTasks: 0,
        lastAccessed: new Date().toISOString(),
        ...data
      };
      setProjects([newProject, ...projects]);
    }
    setSelectedProject(null);
  };

  const handleLongPress = (project: Project) => {
    setSelectedProject(project);
    setActionsVisible(true);
  };

  const handleDeleteConfirmed = () => {
    if (selectedProject) {
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      setSelectedProject(null);
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
          />
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
