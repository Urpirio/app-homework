import { useTheme } from '@/hooks/useTheme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Platform } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import api from '@/utils/api';
import { UserRole } from '@/types/auth';

interface TaskData {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  type?: 'ASSIGNMENT' | 'EXAM' | 'NOTE' | 'QUIZ';
  maxGrade?: number;
}

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: TaskData) => void;
  initialData?: TaskData | null;
  userRole?: string;
}

export const TaskModal = ({ visible, onClose, onSave, initialData, userRole }: TaskModalProps) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [type, setType] = useState<'ASSIGNMENT' | 'EXAM' | 'NOTE' | 'QUIZ'>('ASSIGNMENT');
  const [maxGrade, setMaxGrade] = useState('100');
  const [submission, setSubmission] = useState<any>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      // Intentar parsear la fecha si existe
      if (initialData.dueDate) {
        const d = new Date(initialData.dueDate);
        if (!isNaN(d.getTime())) setDate(d);
      }
      setStatus(initialData.status as any || 'TODO');
      setType(initialData.type as any || 'ASSIGNMENT');
      setMaxGrade(initialData.maxGrade?.toString() || '100');
      
      if (initialData.id) {
        fetchSubmission(initialData.id);
      }
    } else {
      setTitle('');
      setDescription('');
      setDate(new Date());
      setStatus('TODO');
      setType('ASSIGNMENT');
      setMaxGrade('100');
      setSubmission(null);
    }
  }, [initialData, visible]);

  const fetchSubmission = async (taskId: string) => {
    setLoadingSubmission(true);
    try {
      const res = await api.get(`/submissions/task/${taskId}`);
      if (res.data && res.data.length > 0) {
        setSubmission(res.data[0]);
      } else {
        setSubmission(null);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleSubmitHomework = async () => {
    if (!initialData?.id) return;
    try {
      await api.post('/submissions', {
        taskId: initialData.id,
        content: 'Entrega realizada desde la app móvil',
      });
      fetchSubmission(initialData.id);
    } catch (error) {
      console.error('Error submitting homework:', error);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const formatDate = (d: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return d.toLocaleDateString('es-ES', options);
  };

  const handleSave = () => {
    if (title.trim()) {
      onSave({ 
        id: initialData?.id, 
        title, 
        description, 
        dueDate: date.toISOString(),
        status,
        type,
        maxGrade: parseInt(maxGrade) || 100
      });
      onClose();
    }
  };

  const isEditing = !!initialData;

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
        </Text>
        
        <View style={styles.inputContainer}>
          <AnimatedInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título de la tarea"
            icon="list"
          />
          
          <AnimatedInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción (opcional)"
            icon="document-text-outline"
          />

          <Pressable 
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateSelector, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.dateIcon}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.dateContent}>
              <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Fecha de entrega</Text>
              <Text style={[styles.dateValue, { color: theme.colors.text }]}>{formatDate(date)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Estado</Text>
        <View style={styles.statusRow}>
          <StatusOption 
            label="Pendiente" 
            active={status === 'TODO'} 
            onPress={() => setStatus('TODO')} 
            color={theme.colors.border}
          />
          <StatusOption 
            label="En curso" 
            active={status === 'IN_PROGRESS'} 
            onPress={() => setStatus('IN_PROGRESS')} 
            color={theme.colors.primary}
          />
          <StatusOption 
            label="Listo" 
            active={status === 'DONE'} 
            onPress={() => setStatus('DONE')} 
            color={theme.colors.success}
          />
        </View>

        {/* Academic Section */}
        {isEditing && userRole === UserRole.STUDENT && (
          <View style={[styles.academicSection, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.academicTitle, { color: theme.colors.text }]}>Mi Entrega</Text>
            {loadingSubmission ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : submission ? (
              <View>
                <View style={styles.submissionStatus}>
                  <Ionicons 
                    name={submission.status === 'GRADED' ? "checkbox" : "time"} 
                    size={20} 
                    color={submission.status === 'GRADED' ? theme.colors.success : theme.colors.primary} 
                  />
                  <Text style={[styles.submissionStatusText, { color: theme.colors.text }]}>
                    {submission.status === 'GRADED' ? 'Calificado' : 'Entregado'}
                  </Text>
                </View>
                {submission.status === 'GRADED' && (
                  <View style={styles.gradeContainer}>
                    <Text style={[styles.gradeValue, { color: theme.colors.success }]}>
                      {submission.grade} / {initialData?.maxGrade || 100}
                    </Text>
                    {submission.feedback && (
                      <Text style={[styles.feedback, { color: theme.colors.textSecondary }]}>
                        "{submission.feedback}"
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <AnimatedButton 
                title="Entregar Tarea" 
                onPress={handleSubmitHomework}
                icon="cloud-upload-outline"
              />
            )}
          </View>
        )}

        {isEditing && (userRole === UserRole.TEACHER || userRole === UserRole.SCHOOL_ADMIN) && (
          <View style={styles.teacherSection}>
            <Pressable 
              style={[styles.teacherAction, { backgroundColor: theme.colors.primaryLight }]}
              onPress={() => {
                onClose();
                router.push(`/tasks/${initialData.id}/submissions`);
              }}
            >
              <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.teacherActionText, { color: theme.colors.primary }]}>Ver Entregas</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title={isEditing ? "Guardar Cambios" : "Crear Tarea"}
            onPress={handleSave}
            disabled={!title.trim()}
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const StatusOption = ({ label, active, onPress, color }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={[
        styles.statusOption, 
        { 
          backgroundColor: active ? color : theme.colors.card,
          borderColor: active ? color : theme.colors.border,
        }
      ]}
    >
      <Text style={[styles.statusOptionText, { color: active ? '#FFFFFF' : theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 10,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#007AFF10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContent: {
    flex: 1,
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 12,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  academicSection: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  academicTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  submissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  submissionStatusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  gradeContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  gradeValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  feedback: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  teacherSection: {
    marginBottom: 20,
  },
  teacherAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  teacherActionText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
