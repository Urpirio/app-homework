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
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Submission Flow States
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComment, setSubmissionComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const fetchTaskDetail = async () => {
    try {
      if (typeof id === 'string' && id.startsWith('t')) {
        const mockTasks: any = {
          t1: { 
            title: 'Guía de identidades trigonométricas', 
            description: 'Resolver los 20 ejercicios de la guía adjunta. Es necesario mostrar el procedimiento completo paso a paso.',
            startDate: '2026-05-01',
            deadline: '2026-05-15',
            status: 'done',
            subject: 'Matemáticas IV',
            resources: [{ id: 'r1', name: 'Guía de Fórmulas.pdf' }],
            submission: { date: '2026-05-10 14:30', grade: 9.0, feedback: 'Excelente procedimiento.', fileName: 'Mi_Tarea_Algebra.pdf' }
          },
          t2: { 
            title: 'Examen de límites', 
            description: 'Repasar conceptos de límites al infinito y continuidad. El examen será presencial.',
            startDate: '2026-05-10',
            deadline: '2026-05-20',
            status: 'todo',
            subject: 'Matemáticas IV',
            resources: [{ id: 'r3', name: 'Ejercicios de práctica.pdf' }],
            submission: null
          }
        };
        setTask(mockTasks[id] || mockTasks.t1);
        setLoading(false);
        return;
      }
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTaskDetail();
    }, [id])
  );

  const handlePickFile = () => {
    // Simulación de selección de archivo
    setSelectedFile({ name: 'Tarea_Final_Resuelta.pdf', size: '2.4 MB' });
  };

  const handleSubmitTask = async () => {
    if (!selectedFile) {
      Alert.alert('Archivo requerido', 'Por favor selecciona el archivo de tu tarea.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Simulación de API call
      setTimeout(() => {
        setTask({
          ...task,
          status: 'done',
          submission: {
            date: new Date().toLocaleString(),
            fileName: selectedFile.name,
            grade: null,
            feedback: null
          }
        });
        setIsSubmitting(false);
        setSubmitModalVisible(false);
        Toast.show({ type: 'success', text1: 'Tarea enviada', text2: 'Tu entrega se realizó correctamente.' });
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Error', 'No se pudo subir la tarea.');
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  const isSubmitted = task?.submissions?.length > 0;
  const submission = isSubmitted ? task.submissions[0] : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Detalle de Tarea</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {task?.project?.name}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Animated.View entering={FadeInDown.duration(500)}>
              <View style={styles.datesRow}>
                <View style={[styles.dateBox, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.dateText}>Inicio: {task?.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View style={[styles.dateBox, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="time-outline" size={16} color="#FF3B30" />
                  <Text style={styles.dateText}>Límite: {task?.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Pendiente'}</Text>
                </View>
              </View>

              <Text style={[styles.title, { color: theme.colors.text }]}>{task?.title}</Text>
              
              <View style={[styles.statusBadge, { backgroundColor: isSubmitted ? '#E8F5E9' : '#FFF3E0' }]}>
                <Ionicons name={isSubmitted ? "checkmark-done-circle" : "alert-circle"} size={18} color={isSubmitted ? "#2E7D32" : "#EF6C00"} />
                <Text style={[styles.statusText, { color: isSubmitted ? "#2E7D32" : "#EF6C00" }]}>
                  {isSubmitted ? 'Tarea Entregada' : 'Pendiente de Entrega'}
                </Text>
              </View>

              <Text style={[styles.description, { color: theme.colors.text }]}>{task?.description}</Text>

              {task?.resources?.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recursos de Apoyo</Text>
                  {task.resources.map((res: any) => (
                    <Pressable key={res.id} style={[styles.resCard, { backgroundColor: theme.colors.card }]}>
                      <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                      <Text style={[styles.resName, { color: theme.colors.text }]}>{res.name}</Text>
                      <Ionicons name="download-outline" size={18} color={theme.colors.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.submissionArea}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tu Entrega</Text>
                {isSubmitted ? (
                   <View style={[styles.subCard, { backgroundColor: theme.colors.card }]}>
                     <View style={styles.subHeader}>
                       <Ionicons name="document-text" size={24} color={theme.colors.primary} />
                       <View style={{ flex: 1, marginLeft: 12 }}>
                         <Text style={[styles.subFileName, { color: theme.colors.text }]}>{submission.fileName || 'Archivo de entrega'}</Text>
                         <Text style={[styles.subDate, { color: theme.colors.textSecondary }]}>Enviado el {new Date(submission.createdAt).toLocaleString()}</Text>
                       </View>
                       {submission.grade && (
                         <View style={[styles.gradeBadge, { backgroundColor: theme.colors.primaryLight }]}>
                           <Text style={[styles.gradeText, { color: theme.colors.primary }]}>{submission.grade}</Text>
                         </View>
                       )}
                     </View>
                     {submission.feedback && (
                       <View style={[styles.feedback, { backgroundColor: theme.colors.background }]}>
                         <Text style={[styles.feedbackTitle, { color: theme.colors.textSecondary }]}>Feedback del Maestro:</Text>
                         <Text style={[styles.feedbackText, { color: theme.colors.text }]}>{submission.feedback}</Text>
                       </View>
                     )}
                   </View>
                ) : (
                  <View style={[styles.emptySub, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="cloud-upload-outline" size={32} color={theme.colors.textSecondary} opacity={0.5} />
                    <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>Sin entrega realizada</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        {!isSubmitted && (
          <View style={styles.footer}>
            <Pressable onPress={() => setSubmitModalVisible(true)} style={[styles.mainBtn, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="arrow-up-circle" size={24} color="#FFF" />
              <Text style={styles.mainBtnText}>Subir Tarea</Text>
            </Pressable>
          </View>
        )}

        {/* Modal de Subida */}
        <Modal visible={submitModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Subir Entrega</Text>
                <Pressable onPress={() => setSubmitModalVisible(false)}><Ionicons name="close" size={24} color={theme.colors.text} /></Pressable>
              </View>

              {!selectedFile ? (
                <Pressable onPress={handlePickFile} style={[styles.filePicker, { borderColor: theme.colors.border }]}>
                  <Ionicons name="add-circle-outline" size={40} color={theme.colors.primary} />
                  <Text style={[styles.filePickerText, { color: theme.colors.text }]}>Seleccionar archivo (PDF, DOCX, JPG)</Text>
                </Pressable>
              ) : (
                <View style={[styles.selectedFile, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="document" size={24} color={theme.colors.primary} />
                  <Text style={[styles.selectedFileName, { color: theme.colors.primary }]} numberOfLines={1}>{selectedFile.name}</Text>
                  <Pressable onPress={() => setSelectedFile(null)}><Ionicons name="trash" size={20} color="#FF3B30" /></Pressable>
                </View>
              )}

              <TextInput
                style={[styles.commentInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                placeholder="Escribe un comentario opcional..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                value={submissionComment}
                onChangeText={setSubmissionComment}
              />

              <Pressable 
                onPress={handleSubmitTask}
                disabled={isSubmitting}
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary, opacity: isSubmitting ? 0.6 : 1 }]}
              >
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="send" size={20} color="#FFF" />
                    <Text style={styles.submitBtnText}>Enviar Tarea</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, opacity: 0.7 },
  content: { paddingHorizontal: 20 },
  datesRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, gap: 6 },
  dateText: { fontSize: 11, fontWeight: '600', color: '#666' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 6, marginBottom: 20 },
  statusText: { fontSize: 13, fontWeight: '700' },
  description: { fontSize: 15, lineHeight: 24, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  resCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8, gap: 10 },
  resName: { flex: 1, fontSize: 14, fontWeight: '600' },
  submissionArea: { marginTop: 10 },
  emptySub: { padding: 24, borderRadius: 24, alignItems: 'center', gap: 8 },
  emptySubText: { fontSize: 13, fontWeight: '600' },
  subCard: { padding: 20, borderRadius: 24 },
  subHeader: { flexDirection: 'row', alignItems: 'center' },
  subFileName: { fontSize: 15, fontWeight: '700' },
  subDate: { fontSize: 12, marginTop: 2 },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  gradeText: { fontSize: 18, fontWeight: '900' },
  feedback: { marginTop: 16, padding: 16, borderRadius: 16 },
  feedbackTitle: { fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  feedbackText: { fontSize: 14, lineHeight: 20 },
  footer: { padding: 20, position: 'absolute', bottom: 0, width: '100%' },
  mainBtn: { height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { padding: 30, borderTopLeftRadius: 32, borderTopRightRadius: 32, minHeight: 450 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  filePicker: { height: 120, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 10 },
  filePickerText: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },
  selectedFile: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 20, gap: 12 },
  selectedFileName: { flex: 1, fontSize: 15, fontWeight: '700' },
  commentInput: { height: 100, borderRadius: 20, padding: 16, textAlignVertical: 'top', marginBottom: 30, fontSize: 14 },
  submitBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
