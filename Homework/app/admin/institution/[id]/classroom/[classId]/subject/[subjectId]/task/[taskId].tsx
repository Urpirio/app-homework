import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

export default function TaskDetailScreen() {
  const { id, classId, subjectId, taskId } = useLocalSearchParams<{ id: string, classId: string, subjectId: string, taskId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [task, setTask] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTaskAndSubmissions = async () => {
    try {
      const [taskRes, subsRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/submissions`)
      ]);
      setTask(taskRes.data);
      setSubmissions(subsRes.data);
    } catch (error) {
      // Mock data
      setTask({ 
        id: taskId, 
        title: 'Ecuaciones de Segundo Grado', 
        description: 'Resolver los ejercicios de la página 45 del libro de texto y subir una foto del procedimiento.',
        startDate: '2026-05-01',
        deadline: '2026-05-10',
        resources: [
          { id: 'r1', name: 'Guía de Fórmulas', url: 'https://example.com/guia.pdf' },
          { id: 'r2', name: 'Video Tutorial', url: 'https://youtube.com/...' }
        ]
      });
      setSubmissions([
        { id: 's1', studentName: 'Juan Pérez', date: '2026-05-01 10:30', status: 'Graded', grade: 9.5 },
        { id: 's2', studentName: 'María García', date: '2026-05-02 09:15', status: 'Graded', grade: 8.0 },
        { id: 's3', studentName: 'Carlos López', date: '2026-05-02 14:45', status: 'Pending', grade: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTaskAndSubmissions();
    }, [taskId])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Detalle de Tarea</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {task?.title}
            </Text>
          </View>
          <Pressable 
            onPress={() => router.push(`/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/task/${taskId}/edit`)}
            style={[styles.editBtn, { backgroundColor: theme.colors.primaryLight }]}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.taskInfoSection}>
                <View style={styles.datesRow}>
                  <View style={[styles.dateBox, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                    <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>Inicio: {task?.startDate}</Text>
                  </View>
                  <View style={[styles.dateBox, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="time-outline" size={16} color="#FF3B30" />
                    <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>Límite: {task?.deadline}</Text>
                  </View>
                </View>
                <Text style={[styles.description, { color: theme.colors.text }]}>{task?.description}</Text>
                
                {task?.resources && task.resources.length > 0 && (
                  <View style={styles.resourcesSection}>
                    <Text style={[styles.resTitle, { color: theme.colors.text }]}>Recursos de Apoyo</Text>
                    {task.resources.map((res: any) => (
                      <Pressable key={res.id} style={[styles.resCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                        <Text style={[styles.resName, { color: theme.colors.text }]} numberOfLines={1}>{res.name}</Text>
                        <Ionicons name="download-outline" size={18} color={theme.colors.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.submissionsHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Entregas de Alumnos</Text>
                <Text style={[styles.count, { color: theme.colors.primary }]}>{submissions.length} totales</Text>
              </View>

              {submissions.map((item) => (
                <View key={item.id} style={[styles.submissionCard, { backgroundColor: theme.colors.card, marginHorizontal: 20 }]}>
                  <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                      {item.studentName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.subInfo}>
                    <Text style={[styles.studentName, { color: theme.colors.text }]}>{item.studentName}</Text>
                    <Text style={[styles.subDate, { color: theme.colors.textSecondary }]}>{item.date}</Text>
                  </View>
                  <View style={styles.subAction}>
                    {item.grade !== null && (
                      <View style={[styles.gradeBadge, { backgroundColor: theme.colors.success + '15' }]}>
                        <Text style={[styles.gradeText, { color: theme.colors.success }]}>{item.grade}</Text>
                      </View>
                    )}
                    <Pressable 
                      onPress={() => router.push(`/admin/institution/${id}/classroom/${classId}/subject/${subjectId}/task/${taskId}/submission/${item.id}`)}
                      style={[styles.viewBtn, { backgroundColor: theme.colors.primary }]}
                    >
                      <Text style={styles.viewBtnText}>Ver Entrega</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerText: { marginLeft: 10, flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.7 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfoSection: { paddingHorizontal: 20, marginBottom: 20 },
  datesRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, gap: 6 },
  dateText: { fontSize: 11, fontWeight: '600' },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  resourcesSection: { marginTop: 10 },
  resTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  resCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8, gap: 10 },
  resName: { flex: 1, fontSize: 13, fontWeight: '600' },
  submissionsHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 10
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  count: { fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  submissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  subInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700' },
  subDate: { fontSize: 12, marginTop: 2 },
  subAction: { alignItems: 'flex-end', gap: 6 },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  gradeText: { fontSize: 12, fontWeight: '800' },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  viewBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
