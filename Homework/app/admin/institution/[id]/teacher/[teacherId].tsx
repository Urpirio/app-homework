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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TeacherProfileScreen() {
  const { id, teacherId } = useLocalSearchParams<{ id: string, teacherId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherProfile();
  }, [teacherId]);

  const fetchTeacherProfile = async () => {
    try {
      const res = await api.get(`/teachers/${teacherId}/profile`);
      setTeacher(res.data);
    } catch (error) {
      // Mock data
      setTeacher({
        id: teacherId,
        fullName: 'Prof. Alberto Ruiz',
        email: 'alberto@school.com',
        specialty: 'Ciencias Exactas',
        bio: 'Apasionado de las matemáticas y la física con más de 10 años de experiencia docente.',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop',
        stats: {
          totalStudents: 145,
          totalSubjects: 4,
          avgPerformance: 8.2,
          attendance: '95%'
        },
        subjects: [
          { id: 's1', name: 'Matemáticas Avanzadas', classroom: '6to A', students: 32 },
          { id: 's2', name: 'Física I', classroom: '5to B', students: 28 },
          { id: 's3', name: 'Geometría', classroom: '4to C', students: 35 },
          { id: 's4', name: 'Cálculo Diferencial', classroom: '6to B', students: 50 },
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Perfil del Maestro</Text>
          <Pressable 
            onPress={() => router.push({
              pathname: '/chat/[id]',
              params: { id: teacherId, name: teacher?.fullName, type: 'user' }
            })} 
            style={styles.actionHeaderBtn}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
            <Image source={{ uri: teacher?.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{teacher?.fullName}</Text>
              <Text style={[styles.specialty, { color: theme.colors.primary }]}>{teacher?.specialty}</Text>
              <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{teacher?.email}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsGrid}>
            <Pressable 
              onPress={() => router.push(`/admin/institution/${id}/teacher/${teacherId}/students`)}
              style={[styles.statItem, { backgroundColor: theme.colors.card }]}
            >
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{teacher?.stats.totalStudents}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Alumnos</Text>
            </Pressable>
            <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#5856D6' }]}>{teacher?.stats.totalSubjects}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Materias</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>{teacher?.stats.avgPerformance}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Promedio</Text>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Biografía</Text>
            <Text style={[styles.bioText, { color: theme.colors.textSecondary }]}>{teacher?.bio}</Text>
          </View>

          {/* Subjects Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>
                Materias que imparte
              </Text>
              {teacher?.subjects.length > 3 && (
                <Pressable onPress={() => router.push(`/admin/institution/${id}/teacher/${teacherId}/subjects`)}>
                  <Text style={[styles.seeAll, { color: theme.colors.primary }]}>Ver todas</Text>
                </Pressable>
              )}
            </View>
            
            {teacher?.subjects.slice(0, 3).map((subject: any) => (
              <Pressable 
                key={subject.id} 
                onPress={() => router.push(`/admin/institution/${id}/classroom/${subject.classId || 'mock_class'}/subject/${subject.id}`)}
                style={({ pressed }) => [
                  styles.subjectCard, 
                  { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="journal" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subjectName, { color: theme.colors.text }]}>{subject.name}</Text>
                  <Text style={[styles.subjectDetail, { color: theme.colors.textSecondary }]}>
                    {subject.classroom} • {subject.students} Estudiantes
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.border} />
              </Pressable>
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
  specialty: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  subjectDetail: {
    fontSize: 12,
    marginTop: 2,
  },
});
