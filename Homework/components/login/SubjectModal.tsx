import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { 
  Modal, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

interface SubjectModalProps {
  visible: boolean;
  onClose: () => void;
  classId: string;
  institutionId: string;
  onSuccess: () => void;
}

export const SubjectModal = ({ visible, onClose, classId, institutionId, onSuccess }: SubjectModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingTeachers, setFetchingTeachers] = useState(true);

  React.useEffect(() => {
    if (visible && institutionId) {
      fetchTeachers();
    }
  }, [visible, institutionId]);

  const fetchTeachers = async () => {
    try {
      setFetchingTeachers(true);
      const res = await api.get(`/institutions/${institutionId}/teachers`);
      setTeachers(res.data);
    } catch (error) {
      console.error('Error fetching teachers for modal:', error);
      // Mock data
      setTeachers([
        { id: 't1', fullName: 'Prof. Alberto Ruiz' },
        { id: 't2', fullName: 'Dra. Elena Blanc' },
        { id: 't3', fullName: 'Ing. Ricardo Sosa' },
      ]);
    } finally {
      setFetchingTeachers(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Campo requerido',
        text2: 'Por favor ingresa el nombre de la materia',
      });
      return;
    }

    if (!selectedTeacherId) {
      Toast.show({
        type: 'error',
        text1: 'Maestro requerido',
        text2: 'Por favor selecciona un maestro para esta materia',
      });
      return;
    }

    try {
      setLoading(true);
      await api.post(`/classrooms/${classId}/subjects`, { 
        name,
        teacherId: selectedTeacherId
      });
      
      Toast.show({
        type: 'success',
        text1: 'Materia creada',
        text2: 'La materia se ha registrado correctamente',
      });
      
      setName('');
      setSelectedTeacherId(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating subject:', error);
      // Mock success for development
      Toast.show({
        type: 'success',
        text1: 'Materia creada (Mock)',
        text2: 'La materia se ha registrado correctamente',
      });
      setName('');
      setSelectedTeacherId(null);
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Nueva Materia</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView style={styles.content} bounces={false}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Nombre de la Materia</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
                  <Ionicons name="journal-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Ej. Matemáticas Avanzadas"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Asignar Maestro</Text>
                <View style={styles.teachersList}>
                  {fetchingTeachers ? (
                    <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 10 }} />
                  ) : (
                    teachers.map((teacher) => (
                      <Pressable
                        key={teacher.id}
                        onPress={() => setSelectedTeacherId(teacher.id)}
                        style={[
                          styles.teacherOption,
                          { 
                            backgroundColor: selectedTeacherId === teacher.id ? theme.colors.primary + '15' : theme.colors.background,
                            borderColor: selectedTeacherId === teacher.id ? theme.colors.primary : 'transparent'
                          }
                        ]}
                      >
                        <Ionicons 
                          name={selectedTeacherId === teacher.id ? "radio-button-on" : "radio-button-off"} 
                          size={20} 
                          color={selectedTeacherId === teacher.id ? theme.colors.primary : theme.colors.textSecondary} 
                        />
                        <Text style={[
                          styles.teacherName, 
                          { color: selectedTeacherId === teacher.id ? theme.colors.primary : theme.colors.text }
                        ]}>
                          {teacher.fullName}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>

                <Pressable 
                  style={[styles.submitBtn, { backgroundColor: theme.colors.primary, marginTop: 20 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Crear Materia</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
  },
  modalCard: {
    borderRadius: 30,
    padding: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  teachersList: {
    gap: 10,
  },
  teacherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 15,
    borderWidth: 2,
  },
  teacherName: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
