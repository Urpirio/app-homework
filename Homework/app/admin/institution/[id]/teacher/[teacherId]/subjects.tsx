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
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

export default function TeacherSubjectsScreen() {
  const { id, teacherId } = useLocalSearchParams<{ id: string, teacherId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherSubjects();
  }, [teacherId]);

  const fetchTeacherSubjects = async () => {
    try {
      const res = await api.get(`/teachers/${teacherId}/subjects`);
      setSubjects(res.data);
    } catch (error) {
      // Mock data
      setSubjects([
        { id: 's1', name: 'Matemáticas Avanzadas', classroom: '6to A', students: 32, classId: 'c1' },
        { id: 's2', name: 'Física I', classroom: '5to B', students: 28, classId: 'c2' },
        { id: 's3', name: 'Geometría', classroom: '4to C', students: 35, classId: 'c3' },
        { id: 's4', name: 'Cálculo Diferencial', classroom: '6to B', students: 50, classId: 'c1' },
        { id: 's5', name: 'Álgebra Lineal', classroom: '5to A', students: 30, classId: 'c2' },
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Materias Asignadas</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/admin/institution/${id}/classroom/${item.classId || 'mock'}/subject/${item.id}`)}
                style={({ pressed }) => [
                  styles.subjectCard, 
                  { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="journal" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectName, { color: theme.colors.text }]}>{item.name}</Text>
                  <Text style={[styles.subjectDetail, { color: theme.colors.textSecondary }]}>
                    Aula: {item.classroom} • {item.students} Estudiantes
                  </Text>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  listContent: { padding: 20 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  subjectIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
  },
  subjectDetail: {
    fontSize: 13,
    marginTop: 2,
  },
});
