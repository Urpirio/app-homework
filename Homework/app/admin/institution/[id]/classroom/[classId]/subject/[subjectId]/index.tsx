import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator,
  Dimensions,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SubjectDetailScreen() {
  const { id, classId, subjectId } = useLocalSearchParams<{ id: string, classId: string, subjectId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectData();
  }, [subjectId]);

  const fetchSubjectData = async () => {
    try {
      const res = await api.get(`/subjects/${subjectId}/details`);
      setSubject(res.data);
    } catch (error) {
      // Mock data
      setSubject({
        id: subjectId,
        name: 'Matemáticas Avanzadas',
        teachers: [
          { id: 't1', fullName: 'Prof. Alberto Ruiz' },
          { id: 't2', fullName: 'Dra. Elena Blanc' }
        ],
        stats: {
          avgGrade: 8.7,
          totalTasks: 12,
          submittedTasks: 145,
          totalStudents: 15
        },
        recentSubmissions: [
          { id: 'sub1', studentName: 'Juan Pérez', taskName: 'Ecuaciones 2do grado', status: 'Graded', grade: 9.5 },
          { id: 'sub2', studentName: 'María García', taskName: 'Ecuaciones 2do grado', status: 'Graded', grade: 8.0 },
          { id: 'sub3', studentName: 'Carlos López', taskName: 'Ecuaciones 2do grado', status: 'Pending', grade: null },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{subject?.name}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Gestión de Materia</Text>
          </View>
          <Pressable 
            onPress={() => router.push(`/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/edit`)}
            style={[styles.editBtn, { backgroundColor: theme.colors.primaryLight }]}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Teachers Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Maestros Asignados</Text>
            <View style={styles.teacherGrid}>
              {subject?.teachers.map((teacher: any) => (
                <View key={teacher.id} style={[styles.teacherBadge, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="person" size={16} color={theme.colors.primary} />
                  <Text style={[styles.teacherName, { color: theme.colors.text }]}>{teacher.fullName}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{subject?.stats.avgGrade}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Promedio Gral.</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#5856D6' }]}>{subject?.stats.submittedTasks}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Entregas</Text>
            </View>
            <Pressable 
              onPress={() => router.push(`/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/tasks`)}
              style={[styles.statBox, { backgroundColor: theme.colors.card }]}
            >
              <Text style={[styles.statValue, { color: '#FF9500' }]}>{subject?.stats.totalTasks}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tareas</Text>
            </Pressable>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Actividad Reciente</Text>
            {subject?.recentSubmissions.map((sub: any) => (
              <View key={sub.id} style={[styles.submissionCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.subInfo}>
                  <Text style={[styles.studentName, { color: theme.colors.text }]}>{sub.studentName}</Text>
                  <Text style={[styles.taskName, { color: theme.colors.textSecondary }]}>{sub.taskName}</Text>
                </View>
                {sub.grade !== null ? (
                  <View style={[styles.gradeBadge, { backgroundColor: theme.colors.success + '15' }]}>
                    <Text style={[styles.gradeText, { color: theme.colors.success }]}>{sub.grade}</Text>
                  </View>
                ) : (
                  <View style={[styles.pendingBadge, { backgroundColor: theme.colors.border + '30' }]}>
                    <Text style={[styles.pendingText, { color: theme.colors.textSecondary }]}>Pendiente</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <Pressable 
            style={[styles.reportBtn, { borderColor: theme.colors.primary }]}
            onPress={() => {}}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.reportBtnText, { color: theme.colors.primary }]}>Ver Reporte Detallado</Text>
          </Pressable>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 10 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center' 
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  teacherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teacherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  teacherName: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  submissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
  },
  subInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  taskName: {
    fontSize: 13,
    marginTop: 2,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontWeight: '800',
    fontSize: 14,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 2,
    marginTop: 10,
  },
  reportBtnText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
