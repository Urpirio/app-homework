import { BackgroundShapes } from '@/components/login/BackgroundShapes';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_UNITS: Record<string, any[]> = {
  m1: [
    { id: 'u1', name: 'Unidad 1: Álgebra y Trigonometría', description: 'Fundamentos de funciones y identidades.', progress: 50, tasksCount: 4 },
    { id: 'u2', name: 'Unidad 2: Cálculo Diferencial', description: 'Límites, continuidad y derivadas.', progress: 10, tasksCount: 3 },
    { id: 'u3', name: 'Unidad 3: Aplicaciones', description: 'Optimización y problemas reales.', progress: 0, tasksCount: 2 },
  ],
  m2: [
    { id: 'h1', name: 'Unidad 1: Revoluciones Modernas', description: 'Revolución Francesa e Industrial.', progress: 80, tasksCount: 5 },
    { id: 'h2', name: 'Unidad 2: Conflictos Mundiales', description: 'Guerras mundiales y Guerra Fría.', progress: 20, tasksCount: 4 },
  ]
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

  const [project, setProject] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = async () => {
    if (!project) setLoading(true);
    try {
      if (typeof id === 'string' && id.startsWith('m')) {
        const mockSubject = id === 'm1' ? { name: 'Matemáticas IV', color: '#5856D6' } : { name: 'Historia Universal', color: '#FF9500' };
        setProject({ ...mockSubject, id, description: 'Programa académico oficial del ciclo actual.' });
        setUnits(MOCK_UNITS[id] || MOCK_UNITS.m1);
        setTeachers([{ id: 't1', name: 'Prof. Alberto Rivera', role: 'teacher' }]);
        setStudents([
          { id: 'u2', name: 'Ana López' },
          { id: 'u3', name: 'Carlos Ruiz' },
          { id: 'u5', name: 'María García' },
          { id: 'u6', name: 'Juan Pérez' },
        ]);
        setLoading(false);
        return;
      }

      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
      // Simulación de unidades y alumnos para proyectos reales
      setUnits(MOCK_UNITS.m1); 
      setTeachers(response.data.members?.filter((m: any) => m.role !== 'student').map((m: any) => ({ id: m.user.id, name: m.user.fullName })) || []);
      setStudents(response.data.members?.filter((m: any) => m.role === 'student').map((m: any) => ({ id: m.user.id, name: m.user.fullName })) || []);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProjectData();
    }, [id])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              
              <View style={styles.headerRight}>
                <Pressable 
                  onPress={() => router.push(`/chat/${id}?type=project&name=${encodeURIComponent(project?.name || '')}`)}
                  style={[styles.chatButton, { backgroundColor: theme.colors.primaryLight }]}
                >
                  <Ionicons name="chatbubbles" size={20} color={theme.colors.primary} />
                  <Text style={[styles.chatLabel, { color: theme.colors.primary }]}>Chat Grupal</Text>
                </Pressable>
              </View>
            </View>

            {loading || !project ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <Animated.View entering={FadeInDown.duration(800)}>
                <View style={[styles.colorLabel, { backgroundColor: project.color }]} />
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {project.name}
                </Text>
                
                <View style={styles.teachersSection}>
                  <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Maestro(s)</Text>
                  {teachers.map(teacher => (
                    <View key={teacher.id} style={[styles.teacherCard, { backgroundColor: theme.colors.card }]}>
                      <View style={[styles.teacherAvatar, { backgroundColor: theme.colors.primaryLight }]}>
                        <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{teacher.name?.charAt(0)}</Text>
                      </View>
                      <View style={styles.teacherInfo}>
                        <Text style={[styles.teacherName, { color: theme.colors.text }]}>{teacher.name}</Text>
                        <Text style={[styles.teacherRole, { color: theme.colors.textSecondary }]}>Docente Titular</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.studentsSection}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.facepileContainer}>
                      {students.slice(0, 4).map((student, index) => (
                        <View key={student.id} style={[styles.miniAvatar, { marginLeft: index === 0 ? 0 : -12, zIndex: 10 - index, backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.background }]}>
                          <Text style={[styles.miniAvatarText, { color: theme.colors.primary }]}>{student.name?.charAt(0)}</Text>
                        </View>
                      ))}
                      {students.length > 4 && (
                        <View style={[styles.miniAvatar, { marginLeft: -12, backgroundColor: theme.colors.border, borderColor: theme.colors.background }]}>
                          <Text style={[styles.miniAvatarText, { color: theme.colors.textSecondary }]}>+{students.length - 4}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Pressable 
                      onPress={() => router.push({
                        pathname: '/projects/[id]/students',
                        params: { id, name: project?.name }
                      })} 
                      style={styles.viewAllBtn}
                    >
                      <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>Ver lista de alumnos</Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.unitsSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Unidades de Aprendizaje</Text>
                  {units.map((unit, index) => (
                    <Animated.View key={unit.id} entering={FadeInDown.delay(index * 100)}>
                      <Pressable 
                        onPress={() => router.push({
                          pathname: `/projects/${id}/unit/${unit.id}`,
                          params: { unitName: unit.name }
                        })}
                        style={[styles.unitCard, { backgroundColor: theme.colors.card }]}
                      >
                        <View style={styles.unitInfo}>
                          <Text style={[styles.unitName, { color: theme.colors.text }]}>{unit.name}</Text>
                          <Text style={[styles.unitDesc, { color: theme.colors.textSecondary }]}>{unit.description}</Text>
                          <View style={styles.unitMeta}>
                            <Ionicons name="list-outline" size={14} color={theme.colors.primary} />
                            <Text style={[styles.unitTasksCount, { color: theme.colors.primary }]}>{unit.tasksCount} Tareas</Text>
                          </View>
                        </View>
                        <View style={styles.unitAction}>
                          <View style={[styles.progressCircle, { borderColor: theme.colors.border }]}>
                            <Text style={[styles.progressPercent, { color: theme.colors.text }]}>{unit.progress}%</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
                <View style={{ height: 40 }} />
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  chatButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  chatLabel: { fontSize: 13, fontWeight: '700' },
  colorLabel: { width: 50, height: 5, borderRadius: 3, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
  teachersSection: { marginBottom: 24 },
  sectionSubtitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  teacherCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, marginBottom: 8 },
  teacherAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  teacherInfo: { marginLeft: 12 },
  teacherName: { fontSize: 15, fontWeight: '700' },
  teacherRole: { fontSize: 12, fontWeight: '500' },
  studentsSection: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, fontWeight: '700' },
  facepileContainer: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 32, height: 32, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontSize: 11, fontWeight: '800' },
  unitsSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  unitCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 12 },
  unitInfo: { flex: 1 },
  unitName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  unitDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  unitMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unitTasksCount: { fontSize: 12, fontWeight: '700' },
  unitAction: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  progressPercent: { fontSize: 11, fontWeight: '800' },
});
