import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';
import { GradeModal } from '@/components/login/GradeModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SubmissionDetailScreen() {
  const { id, classId, subjectId, taskId, submissionId } = useLocalSearchParams<{ id: string, classId: string, subjectId: string, taskId: string, submissionId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      const res = await api.get(`/submissions/${submissionId}`);
      setSubmission(res.data);
    } catch (error) {
      // Mock data
      setSubmission({
        id: submissionId,
        studentName: 'Juan Pérez',
        taskTitle: 'Ecuaciones de Segundo Grado',
        content: 'Adjunto el procedimiento de los 5 ejercicios solicitados en clase. Utilicé la fórmula general para todos.',
        fileUrl: 'https://images.unsplash.com/photo-1518131359073-ad293c3f90c9?q=80&w=2070&auto=format&fit=crop',
        submittedAt: '2026-05-01 10:30',
        grade: 9.5,
        feedback: 'Excelente desarrollo de los pasos. Ten cuidado con los signos en el ejercicio 3.'
      });
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
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Revisión de Entrega</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {submission?.studentName}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Tarea</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{submission?.taskTitle}</Text>
              <Text style={[styles.infoDate, { color: theme.colors.textSecondary }]}>Entregado el: {submission?.submittedAt}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mensaje del Alumno</Text>
              <Text style={[styles.textContent, { color: theme.colors.text }]}>{submission?.content}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Archivos Adjuntos</Text>
              <View style={[styles.imageContainer, { backgroundColor: theme.colors.card }]}>
                <Image source={{ uri: submission?.fileUrl }} style={styles.attachmentImage} resizeMode="contain" />
              </View>
            </View>

            {submission?.grade && (
              <View style={[styles.feedbackCard, { backgroundColor: theme.colors.success + '10', borderColor: theme.colors.success + '30' }]}>
                <View style={styles.feedbackHeader}>
                  <Text style={[styles.feedbackTitle, { color: theme.colors.success }]}>Calificación: {submission.grade}</Text>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                </View>
                <Text style={[styles.feedbackText, { color: theme.colors.text }]}>{submission.feedback}</Text>
              </View>
            )}

            <Pressable 
              style={[styles.gradeBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.gradeBtnText}>Editar Calificación</Text>
            </Pressable>
          </ScrollView>
        )}

        <GradeModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          submissionId={submissionId as string}
          currentGrade={submission?.grade}
          currentFeedback={submission?.feedback}
          onSuccess={fetchSubmission}
        />
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  infoCard: { padding: 16, borderRadius: 20, marginBottom: 24 },
  infoLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  infoDate: { fontSize: 12, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  textContent: { fontSize: 15, lineHeight: 22 },
  imageContainer: { width: '100%', height: 250, borderRadius: 20, overflow: 'hidden', padding: 10 },
  attachmentImage: { width: '100%', height: '100%', borderRadius: 10 },
  feedbackCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  feedbackTitle: { fontSize: 16, fontWeight: '800' },
  feedbackText: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  gradeBtn: { height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  gradeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
