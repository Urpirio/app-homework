/**
 * BulkEnrollmentModal
 *
 * Modal for enrolling multiple students into an institution.
 * Uses POST /admin/institution/{id}/enroll-student for each student.
 *
 * Validates: Requirements 6.6
 */

import { AnimatedButton } from '@/components/login/AnimatedButton';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { BaseModal } from '@/components/shared/BaseModal';
import { useEnrollStudent } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

interface BulkEnrollmentModalProps {
  visible: boolean;
  onClose: () => void;
  institutionId: string | null;
  onSuccess?: () => void;
}

interface StudentEntry {
  fullName: string;
  email: string;
}

export function BulkEnrollmentModal({
  visible,
  onClose,
  institutionId,
  onSuccess,
}: BulkEnrollmentModalProps) {
  const { theme } = useTheme();
  const enrollStudent = useEnrollStudent();

  const [students, setStudents] = useState<StudentEntry[]>([
    { fullName: '', email: '' },
  ]);
  const [enrolling, setEnrolling] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const addRow = () => {
    setStudents((prev) => [...prev, { fullName: '', email: '' }]);
  };

  const removeRow = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof StudentEntry, value: string) => {
    setStudents((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleEnroll = async () => {
    if (!institutionId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se ha seleccionado una institucion.',
      });
      return;
    }

    const validStudents = students.filter((s) => s.fullName.trim() && s.email.trim());
    if (validStudents.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Agrega al menos un estudiante con nombre y correo.',
      });
      return;
    }

    setEnrolling(true);
    setProgress({ completed: 0, total: validStudents.length });

    let succeeded = 0;
    let failed = 0;

    for (const student of validStudents) {
      try {
        await enrollStudent.mutateAsync({
          institutionId,
          fullName: student.fullName.trim(),
          email: student.email.trim(),
        });
        succeeded++;
      } catch {
        failed++;
      }
      setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
    }

    setEnrolling(false);

    if (failed === 0) {
      Toast.show({
        type: 'success',
        text1: 'Inscripcion completada',
        text2: `${succeeded} estudiante(s) inscrito(s) correctamente.`,
      });
      setStudents([{ fullName: '', email: '' }]);
      onSuccess?.();
      onClose();
    } else {
      Toast.show({
        type: 'info',
        text1: 'Inscripcion parcial',
        text2: `${succeeded} exitoso(s), ${failed} fallido(s).`,
      });
      onSuccess?.();
    }
  };

  const handleClose = () => {
    if (!enrolling) {
      setStudents([{ fullName: '', email: '' }]);
      setProgress({ completed: 0, total: 0 });
      onClose();
    }
  };

  return (
    <BaseModal visible={visible} onClose={handleClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Inscripcion Masiva
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Agrega estudiantes para inscribirlos en la institucion.
        </Text>

        {students.map((student, index) => (
          <View key={index} style={styles.studentRow}>
            <View style={styles.studentInputs}>
              <AnimatedInput
                value={student.fullName}
                onChangeText={(v: string) => updateRow(index, 'fullName', v)}
                placeholder="Nombre completo"
                icon="person-outline"
              />
              <AnimatedInput
                value={student.email}
                onChangeText={(v: string) => updateRow(index, 'email', v)}
                placeholder="Correo electronico"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {students.length > 1 && (
              <Pressable
                onPress={() => removeRow(index)}
                style={styles.removeBtn}
                accessibilityLabel="Remove student row"
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </Pressable>
            )}
          </View>
        ))}

        <Pressable
          onPress={addRow}
          style={[styles.addRowBtn, { borderColor: theme.colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Add another student"
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.addRowText, { color: theme.colors.primary }]}>
            Agregar otro estudiante
          </Text>
        </Pressable>

        {enrolling && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {progress.completed} / {progress.total}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title={enrolling ? 'Inscribiendo...' : 'Inscribir estudiantes'}
            onPress={handleEnroll}
            loading={enrolling}
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInputs: {
    flex: 1,
  },
  removeBtn: {
    paddingTop: 14,
    paddingLeft: 8,
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addRowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
});
