/**
 * CreateScheduleModal
 *
 * Modal form for teachers to create new schedule entries.
 * Includes fields for day, start time, end time, room, and subject.
 * Runs client-side conflict detection before submission.
 *
 * Validates: Requirements 19.7, 12.8
 */

import { BaseModal } from '@/components/shared/BaseModal';
import { useProfile } from '@/hooks/api/useAuth';
import { useProjects } from '@/hooks/api/useProjects';
import { useCreateSchedule, useSchedules } from '@/hooks/api/useSchedules';
import { useTheme } from '@/hooks/useTheme';
import type { Schedule } from '@/types/schedule';
import { detectScheduleConflict } from '@/utils/scheduleConflict';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

interface SubjectOption {
  id: string;
  name: string;
}

interface CreateScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  /** When provided, the modal uses these subjects instead of fetching all projects */
  subjects?: SubjectOption[];
  /** When provided, overrides the institutionId from user profile */
  institutionId?: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function CreateScheduleModal({ visible, onClose, subjects: externalSubjects, institutionId: externalInstitutionId }: CreateScheduleModalProps) {
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const { data: projects } = useProjects();
  const { data: existingSchedules } = useSchedules();
  const createSchedule = useCreateSchedule();

  const [day, setDay] = useState('Lunes');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Use classroom-specific subjects when provided, otherwise fall back to all projects
  const availableProjects = useMemo(() => {
    if (externalSubjects && externalSubjects.length > 0) return externalSubjects;
    if (!projects) return [];
    return projects;
  }, [externalSubjects, projects]);

  const resetForm = useCallback(() => {
    setDay('Lunes');
    setStartTime('');
    setEndTime('');
    setRoom('');
    setSelectedProjectId('');
    setConflictWarning(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const validateAndCheckConflicts = useCallback((): boolean => {
    // Basic validation
    if (!startTime.trim() || !endTime.trim()) {
      setConflictWarning('Ingresa hora de inicio y fin');
      return false;
    }

    if (!selectedProjectId) {
      setConflictWarning('Selecciona una materia');
      return false;
    }

    // Time format validation (HH:MM)
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (!timeRegex.test(startTime.trim()) || !timeRegex.test(endTime.trim())) {
      setConflictWarning('Formato de hora inválido. Usa HH:MM');
      return false;
    }

    // Check start < end
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      setConflictWarning('La hora de inicio debe ser anterior a la hora de fin');
      return false;
    }

    // Conflict detection (Property 32)
    const schedules: Schedule[] = existingSchedules ?? [];
    const conflict = detectScheduleConflict(
      { day, startTime: startTime.trim(), endTime: endTime.trim(), room: room.trim() || undefined },
      schedules,
    );

    if (conflict.hasConflict) {
      const conflicting = conflict.conflictingSchedules[0];
      const subjectName = conflicting.project?.name ?? 'otra clase';
      setConflictWarning(
        `Conflicto: ${subjectName} ya ocupa ${conflicting.startTime}–${conflicting.endTime}${conflicting.room ? ` en ${conflicting.room}` : ''}`,
      );
      return false;
    }

    setConflictWarning(null);
    return true;
  }, [day, startTime, endTime, room, selectedProjectId, existingSchedules]);

  const handleSubmit = useCallback(async () => {
    if (!validateAndCheckConflicts()) return;

    try {
      await createSchedule.mutateAsync({
        day,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        room: room.trim() || undefined,
        projectId: selectedProjectId,
        institutionId: externalInstitutionId ?? profile?.institutionId ?? '',
      });

      Toast.show({
        type: 'success',
        text1: 'Horario creado',
        text2: 'La clase se agregó al calendario',
        visibilityTime: 2500,
      });

      handleClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo crear el horario',
        visibilityTime: 3000,
      });
    }
  }, [validateAndCheckConflicts, createSchedule, day, startTime, endTime, room, selectedProjectId, profile, handleClose]);

  return (
    <BaseModal visible={visible} onClose={handleClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nuevo Horario</Text>

        {/* Day selector */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Día</Text>
        <View style={styles.dayRow}>
          {DAYS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDay(d)}
              style={[
                styles.dayChip,
                { backgroundColor: day === d ? theme.colors.primary : theme.colors.inputBackground },
              ]}
              accessibilityRole="button"
              accessibilityLabel={d}
              accessibilityState={{ selected: day === d }}
            >
              <Text
                style={[
                  styles.dayChipText,
                  { color: day === d ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                {d.slice(0, 3)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Time inputs */}
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Inicio</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.inputBackground, color: theme.colors.text },
              ]}
              placeholder="08:00"
              placeholderTextColor={theme.colors.border}
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              accessibilityLabel="Hora de inicio"
            />
          </View>
          <View style={styles.timeSeparator}>
            <Ionicons name="arrow-forward" size={18} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.timeField}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Fin</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.inputBackground, color: theme.colors.text },
              ]}
              placeholder="09:30"
              placeholderTextColor={theme.colors.border}
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              accessibilityLabel="Hora de fin"
            />
          </View>
        </View>

        {/* Room */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Aula (opcional)</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.colors.inputBackground, color: theme.colors.text },
          ]}
          placeholder="Ej: Aula 101"
          placeholderTextColor={theme.colors.border}
          value={room}
          onChangeText={setRoom}
          accessibilityLabel="Aula"
        />

        {/* Subject selector */}
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Materia</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
          {availableProjects.map((project: any) => (
            <Pressable
              key={project.id}
              onPress={() => setSelectedProjectId(project.id)}
              style={[
                styles.subjectChip,
                {
                  backgroundColor:
                    selectedProjectId === project.id
                      ? theme.colors.primary
                      : theme.colors.inputBackground,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={project.name}
              accessibilityState={{ selected: selectedProjectId === project.id }}
            >
              <Text
                style={[
                  styles.subjectChipText,
                  { color: selectedProjectId === project.id ? '#FFF' : theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {project.name}
              </Text>
            </Pressable>
          ))}
          {(!availableProjects || availableProjects.length === 0) && (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No hay materias disponibles
            </Text>
          )}
        </ScrollView>

        {/* Conflict warning */}
        {conflictWarning && (
          <View style={[styles.warningBox, { backgroundColor: '#FFF3CD' }]}>
            <Ionicons name="warning-outline" size={16} color="#856404" />
            <Text style={styles.warningText}>{conflictWarning}</Text>
          </View>
        )}

        {/* Submit button */}
        <Pressable
          onPress={handleSubmit}
          disabled={createSchedule.isPending}
          style={[
            styles.submitBtn,
            { backgroundColor: theme.colors.primary, opacity: createSchedule.isPending ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Crear horario"
        >
          {createSchedule.isPending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>Crear Horario</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timeField: {
    flex: 1,
  },
  timeSeparator: {
    paddingBottom: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  subjectScroll: {
    maxHeight: 50,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 10,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
