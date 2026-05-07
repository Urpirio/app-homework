import { AnimatedButton } from '@/components/login/AnimatedButton';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { BaseModal } from '@/components/shared/BaseModal';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { getFullUrl } from '@/utils/media';

import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Alert } from 'react-native';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SubmissionsScreen() {
  const { taskId } = useLocalSearchParams();
  const { theme } = useTheme();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/submissions/task/${taskId}`);
      setSubmissions(res.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubmissions();
    }, [taskId])
  );

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      Alert.alert('Nota inválida', 'La nota debe ser un número entre 0 y 100.');
      return;
    }
    try {
      await api.patch(`/submissions/${selectedSubmission.id}/grade`, {
        grade: gradeNum,
        feedback: feedback.trim() || undefined,
      });
      setGradingModalVisible(false);
      Toast.show({ type: 'success', text1: 'Calificación guardada' });
      fetchSubmissions();
    } catch (error) {
      console.error('Error grading submission:', error);
      Toast.show({ type: 'error', text1: 'Error al guardar calificación' });
    }
  };

  const handleOpenFile = async (fileUrl: string) => {
    try {
      const fullUrl = getFullUrl(fileUrl);
      const fileName = fileUrl.split('/').pop() || 'archivo';
      const localUri = `${FileSystem.cacheDirectory}${fileName}`;

      Toast.show({ type: 'info', text1: 'Descargando archivo...' });
      const { uri } = await FileSystem.downloadAsync(fullUrl, localUri);

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
        });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'No se pudo abrir el archivo.');
    }
  };

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={{ paddingHorizontal: horizontalPadding, flex: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.colors.text }]}>Entregas</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : submissions.length > 0 ? (
            <FlatList
              data={submissions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable 
                  style={[styles.submissionCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => {
                    setSelectedSubmission(item);
                    setGrade(item.grade?.toString() || '');
                    setFeedback(item.feedback || '');
                    setGradingModalVisible(true);
                  }}
                >
                  <View style={styles.submissionInfo}>
                    <Text style={[styles.studentName, { color: theme.colors.text }]}>
                      {item.student?.fullName}
                    </Text>
                    <Text style={[styles.submissionDate, { color: theme.colors.textSecondary }]}>
                      Entregado el {new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: item.status === 'GRADED' ? theme.colors.success + '20' : theme.colors.primary + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: item.status === 'GRADED' ? theme.colors.success : theme.colors.primary }
                    ]}>
                      {item.status === 'GRADED' ? `Nota: ${item.grade}` : 'Pendiente'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
                </Pressable>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Aún no hay entregas para esta tarea.
              </Text>
            </View>
          )}
        </View>

        <BaseModal visible={gradingModalVisible} onClose={() => setGradingModalVisible(false)}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Detalle de Entrega</Text>
            <Text style={[styles.studentLabel, { color: theme.colors.textSecondary }]}>
              {selectedSubmission?.student?.fullName}
            </Text>
            <Text style={[styles.submissionDateLabel, { color: theme.colors.textSecondary }]}>
              Entregado el {selectedSubmission ? new Date(selectedSubmission.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>

            {/* Student comment */}
            {selectedSubmission?.content && (
              <View style={[styles.contentBox, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.contentLabel, { color: theme.colors.textSecondary }]}>Comentario del estudiante</Text>
                <Text style={[styles.contentText, { color: theme.colors.text }]}>{selectedSubmission.content}</Text>
              </View>
            )}

            {/* File attachment */}
            {selectedSubmission?.fileUrl && (
              <Pressable
                onPress={() => handleOpenFile(selectedSubmission.fileUrl)}
                style={[styles.fileBtn, { backgroundColor: theme.colors.primaryLight }]}
              >
                <Ionicons name="document-text" size={22} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileBtnText, { color: theme.colors.primary }]}>
                    {selectedSubmission.fileUrl.split('/').pop() || 'Ver archivo entregado'}
                  </Text>
                  <Text style={[styles.fileBtnSub, { color: theme.colors.textSecondary }]}>Toca para abrir</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
              </Pressable>
            )}

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Grading */}
            <Text style={[styles.gradingTitle, { color: theme.colors.text }]}>Calificación</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Nota (0–100)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={grade}
                onChangeText={setGrade}
                keyboardType="numeric"
                placeholder="Ej. 95"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Feedback para el estudiante</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                placeholder="Buen trabajo, pero podrías mejorar..."
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <AnimatedButton title="Guardar Calificación" onPress={handleGrade} />
          </ScrollView>
        </BaseModal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, gap: 16 },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  submissionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12 
  },
  submissionInfo: { flex: 1 },
  studentName: { fontSize: 17, fontWeight: '700' },
  submissionDate: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center', opacity: 0.6 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  studentLabel: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  submissionDateLabel: { fontSize: 12, marginBottom: 16 },
  contentBox: { padding: 14, borderRadius: 14, marginBottom: 14 },
  contentLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  contentText: { fontSize: 14, lineHeight: 20 },
  fileBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 14 },
  fileBtnText: { fontSize: 14, fontWeight: '700' },
  fileBtnSub: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginVertical: 16 },
  gradingTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
});
