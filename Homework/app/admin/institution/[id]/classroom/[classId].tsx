import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator,
  FlatList,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ClassroomDetailScreen() {
  const { id, classId } = useLocalSearchParams<{ id: string, classId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [classroom, setClassroom] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchClassroomData();
    }, [classId])
  );

  const fetchClassroomData = async () => {
    try {
      const [classRes, subjectsRes] = await Promise.all([
        api.get(`/classrooms/${classId}`),
        api.get(`/classrooms/${classId}/subjects`)
      ]);
      setClassroom(classRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      // Mock data
      setClassroom({ id: classId, name: '6to A - Ciencias', description: 'Aula de ciencias naturales' });
      setSubjects([
        { id: 'sub1', name: 'Biología', avgGrade: 8.5 },
        { id: 'sub2', name: 'Química', avgGrade: 7.8 },
        { id: 'sub3', name: 'Física', avgGrade: 9.0 },
      ]);
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
            <Text style={[styles.title, { color: theme.colors.text }]}>{classroom?.name}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{classroom?.description}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Materias Asignadas</Text>
            <Pressable 
              onPress={() => router.push(`/admin/institution/${id}/classroom/${classId}/add-subject`)}
              style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addBtnText}>Añadir</Text>
            </Pressable>
          </View>

          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <SubjectItem 
                subject={item} 
                onPress={() => router.push(`/admin/institution/${id}/classroom/${classId}/subject/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="journal-outline" size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No hay materias configuradas
                </Text>
              </View>
            }
          />
        </View>


      </ThemedView>
    </SafeAreaView>
  );
}

const SubjectItem = ({ subject, onPress }: { subject: any, onPress: () => void }) => {
  const { theme } = useTheme();
  
  const getGradeColor = (grade: number) => {
    if (grade >= 9) return '#34C759';
    if (grade >= 7) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.subjectCard, 
        { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primaryLight }]}>
        <Ionicons name="journal" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={[styles.subjectName, { color: theme.colors.text }]}>{subject.name}</Text>
        <Text style={[styles.subjectDetail, { color: theme.colors.textSecondary }]}>
          Estado: Activo
        </Text>
      </View>
      <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(subject.avgGrade) + '15' }]}>
        <Text style={[styles.gradeText, { color: getGradeColor(subject.avgGrade) }]}>
          {subject.avgGrade.toFixed(1)}
        </Text>
      </View>
    </Pressable>
  );
};

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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  subjectIcon: {
    width: 48,
    height: 48,
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
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  gradeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});
