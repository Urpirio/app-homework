import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import api from '@/utils/api';
import { BaseModal } from '@/components/shared/BaseModal';
import { AnimatedButton } from '@/components/login/AnimatedButton';

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
    try {
      await api.patch(`/submissions/${selectedSubmission.id}/grade`, {
        grade: parseInt(grade),
        feedback,
      });
      setGradingModalVisible(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error grading submission:', error);
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
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Calificar Entrega</Text>
          <Text style={[styles.studentLabel, { color: theme.colors.textSecondary }]}>
            Estudiante: {selectedSubmission?.student?.fullName}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Calificación (0-100)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={grade}
              onChangeText={setGrade}
              keyboardType="numeric"
              placeholder="Ej. 95"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Comentarios / Feedback</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }
              ]}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              placeholder="Buen trabajo..."
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <AnimatedButton title="Guardar Calificación" onPress={handleGrade} />
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
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  studentLabel: { fontSize: 14, marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    fontSize: 16 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
});
