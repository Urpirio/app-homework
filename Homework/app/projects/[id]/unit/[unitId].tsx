import { TaskItem } from '@/components/home/TaskItem';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useUnitTasksFromProject, useUpdateUnit, useDeleteUnit, useSubjectUnits } from '@/hooks/api/useProjects';
import { useCreateTask } from '@/hooks/api/useTasks';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskForm, TaskFormData } from '@/components/tasks/TaskForm';
import Toast from 'react-native-toast-message';

export default function UnitTasksScreen() {
  const { id, unitId, unitName } = useLocalSearchParams();
  const { theme } = useTheme();

  const projectId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const unitIdStr = typeof unitId === 'string' ? unitId : Array.isArray(unitId) ? unitId[0] : '';

  const { data: profile } = useProfile();
  const isTeacher = profile?.role === 'TEACHER' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'SCHOOL_ADMIN';

  const [showCreateTask, setShowCreateTask] = useState(false);

  const [showEditUnit, setShowEditUnit] = useState(false);
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitDesc, setEditUnitDesc] = useState('');

  const createTask = useCreateTask();
  const updateUnit = useUpdateUnit(projectId);
  const deleteUnit = useDeleteUnit(projectId);

  const { data: units } = useSubjectUnits(projectId);
  const currentUnit = units?.find((u: any) => u.id === unitIdStr);

  // Track focus count to force FlatList re-render after refetch
  const [focusCount, setFocusCount] = useState(0);
  const isMounted = useRef(false);

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useUnitTasksFromProject(projectId, unitIdStr);

  // Refetch when returning from task detail (e.g. after submitting)
  useFocusEffect(
    useCallback(() => {
      if (isMounted.current) {
        // Only refetch on subsequent focuses (not the initial mount)
        refetch().then(() => setFocusCount(c => c + 1));
      } else {
        isMounted.current = true;
      }
    }, [refetch])
  );

  const handleCreateTask = async (formData: TaskFormData) => {
    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        maxGrade: formData.maxGrade,
        projectId,
        unitId: unitIdStr,
        startDate: formData.startDate?.toISOString(),
        dueDate: formData.dueDate?.toISOString(),
        resources: formData.resources,
      });
      setShowCreateTask(false);
      refetch().then(() => setFocusCount(c => c + 1));
      Toast.show({ type: 'success', text1: 'Tarea creada' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error al crear tarea' });
    }
  };

  const handleEditUnit = () => {
    if (!currentUnit) return;
    setEditUnitName(currentUnit.name);
    setEditUnitDesc(currentUnit.description || '');
    setShowEditUnit(true);
  };

  const handleUpdateUnit = async () => {
    if (!editUnitName.trim()) {
      Alert.alert('Campo requerido', 'El nombre de la unidad es obligatorio.');
      return;
    }
    try {
      await updateUnit.mutateAsync({
        id: unitIdStr,
        name: editUnitName.trim(),
        description: editUnitDesc.trim() || undefined,
      });
      setShowEditUnit(false);
      Toast.show({ type: 'success', text1: 'Unidad actualizada' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error al actualizar unidad' });
    }
  };

  const handleDeleteUnit = () => {
    Alert.alert(
      'Eliminar Unidad',
      '¿Estás seguro de que quieres eliminar esta unidad? Se eliminarán todas las tareas asociadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUnit.mutateAsync(unitIdStr);
              Toast.show({ type: 'success', text1: 'Unidad eliminada' });
              router.back();
            } catch {
              Toast.show({ type: 'error', text1: 'Error al eliminar unidad' });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Tareas de la Unidad</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{unitName || 'Unidad'}</Text>
              </View>
            </View>
            <SkeletonLoader rows={5} variant="list-item" />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Tareas de la Unidad</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{unitName || 'Unidad'}</Text>
              </View>
            </View>
            <ErrorState
              error={error}
              onRetry={() => refetch()}
              onBack={() => router.back()}
            />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Tareas de la Unidad</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{currentUnit?.name || unitName || 'Unidad'}</Text>
            </View>
            {isTeacher && (
              <View style={styles.headerActions}>
                <Pressable onPress={handleEditUnit} style={styles.headerActionBtn}>
                  <Ionicons name="pencil" size={20} color={theme.colors.text} />
                </Pressable>
                <Pressable onPress={handleDeleteUnit} style={styles.headerActionBtn}>
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                </Pressable>
              </View>
            )}
          </View>

          <FlatList
            key={focusCount}
            data={tasks ?? []}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            renderItem={({ item, index }) => {
              const submissionCount = (item as any)._count?.submissions ?? 0;
              const totalStudents = (currentUnit as any)?.project?._count?.members ?? 0;
              const submissionRate = totalStudents > 0 ? (submissionCount / totalStudents) : 0;

              return (
                <View style={styles.taskWrapper}>
                  <TaskItem
                    task={item}
                    index={index}
                    onPress={() => router.push(`/tasks/${item.id}`)}
                  />
                  {/* Teacher: Management Row */}
                  {isTeacher && (
                    <View style={styles.teacherTaskActions}>
                      <View style={[
                        styles.submissionBadgeMini, 
                        { backgroundColor: submissionRate >= 0.8 ? '#34C75915' : theme.colors.primaryLight }
                      ]}>
                        <Text style={[
                          styles.submissionBadgeTextMini, 
                          { color: submissionRate >= 0.8 ? '#34C759' : theme.colors.primary }
                        ]}>
                          {submissionCount}/{totalStudents} entregas
                        </Text>
                      </View>
                      
                      <Pressable
                        onPress={() => router.push({ pathname: '/tasks/[taskId]/submissions', params: { taskId: item.id } } as any)}
                        style={[styles.submissionsBtn, { backgroundColor: theme.colors.primaryLight }]}
                      >
                        <Ionicons name="people-outline" size={14} color={theme.colors.primary} />
                        <Text style={[styles.submissionsBtnText, { color: theme.colors.primary }]}>
                          Ver entregas
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="document-text-outline"
                title="Sin tareas"
                message="No hay tareas en esta unidad todavía."
              />
            }
          />

          {/* FAB — Nueva Tarea (teacher only) */}
          {isTeacher && (
            <Pressable
              onPress={() => setShowCreateTask(true)}
              style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="add" size={28} color="#FFF" />
            </Pressable>
          )}

          {/* Create Task Modal */}
          <Modal visible={showCreateTask} transparent animationType="slide" onRequestClose={() => setShowCreateTask(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowCreateTask(false)}>
              <Pressable style={[styles.modalCard, { backgroundColor: theme.colors.card }]} onPress={() => {}}>
                <TaskForm
                  onSubmit={handleCreateTask}
                  onCancel={() => setShowCreateTask(false)}
                  loading={createTask.isPending}
                  submitLabel="Crear Tarea"
                />
              </Pressable>
            </Pressable>
          </Modal>

          {/* Edit Unit Modal */}
          <Modal visible={showEditUnit} transparent animationType="slide" onRequestClose={() => setShowEditUnit(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowEditUnit(false)}>
              <Pressable style={[styles.modalCard, { backgroundColor: theme.colors.card }]} onPress={() => {}}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Editar Unidad</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Nombre de la unidad *"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={editUnitName}
                  onChangeText={setEditUnitName}
                />
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Descripción (opcional)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={editUnitDesc}
                  onChangeText={setEditUnitDesc}
                  multiline
                />
                <View style={styles.modalBtns}>
                  <Pressable onPress={() => setShowEditUnit(false)} style={[styles.modalCancelBtn, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdateUnit}
                    disabled={updateUnit.isPending}
                    style={[styles.modalConfirmBtn, { backgroundColor: theme.colors.primary }]}
                  >
                    <Text style={styles.modalConfirmText}>{updateUnit.isPending ? 'Guardando...' : 'Guardar'}</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  taskWrapper: {
    marginBottom: 12,
  },
  teacherTaskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  submissionBadgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  submissionBadgeTextMini: {
    fontSize: 10,
    fontWeight: '800',
  },
  submissionsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10,
  },
  submissionsBtnText: { fontSize: 12, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 20, right: 0, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15 },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  typeBtnText: { fontSize: 12, fontWeight: '700' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  smallInput: { width: 80, borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 16, textAlign: 'center', fontWeight: '800' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 2, borderRadius: 14, padding: 14, alignItems: 'center' },
  modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
