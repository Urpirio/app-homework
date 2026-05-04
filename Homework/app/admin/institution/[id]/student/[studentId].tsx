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
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

export default function StudentProfileScreen() {
  const { id, studentId } = useLocalSearchParams<{ id: string, studentId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      const res = await api.get(`/students/${studentId}/profile`);
      setStudent(res.data);
    } catch (error) {
      // Mock data
      setStudent({
        id: studentId,
        fullName: 'Juan Pérez',
        email: 'juan.perez@estudiante.com',
        classroom: '6to A - Secundaria',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1974&auto=format&fit=crop',
        parentName: 'Sr. Carlos Pérez',
        parentPhone: '+1 809 555 0123',
        stats: {
          avgGrade: 9.2,
          completedTasks: 45,
          pendingTasks: 3,
          attendance: '98%'
        },
        subjects: [
          { id: 's1', name: 'Matemáticas Avanzadas', teacher: 'Prof. Alberto Ruiz', grade: 9.5 },
          { id: 's2', name: 'Lengua Española', teacher: 'Dra. Elena Blanc', grade: 8.8 },
          { id: 's3', name: 'Historia Universal', teacher: 'Lic. Pedro Gómez', grade: 9.0 },
          { id: 's4', name: 'Ciencias Naturales', teacher: 'Ing. Ricardo Sosa', grade: 9.4 },
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Ficha del Alumno</Text>
          <Pressable 
            onPress={() => router.push({
              pathname: '/chat/[id]',
              params: { id: studentId, name: student?.fullName, type: 'user' }
            })} 
            style={styles.actionHeaderBtn}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
            <Image source={{ uri: student?.avatarUrl || student?.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{student?.fullName}</Text>
              <Text style={[styles.classroom, { color: theme.colors.primary }]}>
                {typeof student?.classroom === 'object' ? student?.classroom?.name : student?.classroom || 'Sin Aula'}
              </Text>
              <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{student?.email}</Text>
            </View>
          </View>

          {/* Academic Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>{student?.stats.avgGrade}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Promedio</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#007AFF' }]}>{student?.stats.completedTasks}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tareas OK</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#FF9500' }]}>{student?.stats.attendance}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Asistencia</Text>
            </View>
          </View>

          {/* Parent Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Información del Tutor</Text>
            <View style={[styles.infoRow, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Padre / Tutor</Text>
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{student?.parentName}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { backgroundColor: theme.colors.card, marginTop: 10 }]}>
              <Ionicons name="call-outline" size={20} color="#34C759" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Teléfono de Emergencia</Text>
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{student?.parentPhone}</Text>
              </View>
            </View>
          </View>

          {/* Subjects and Grades */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Materias y Calificaciones</Text>
            {student?.subjects.map((item: any) => (
              <View key={item.id} style={[styles.subjectCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectName, { color: theme.colors.text }]}>{item.name}</Text>
                  <Text style={[styles.teacherName, { color: theme.colors.textSecondary }]}>{item.teacher}</Text>
                </View>
                <View style={[styles.gradeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.gradeText, { color: theme.colors.primary }]}>
                    {item.grade !== null ? item.grade : item.letter}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  actionHeaderBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 30,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 25,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  classroom: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  teacherName: {
    fontSize: 12,
    marginTop: 2,
  },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
