import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { UploadProgressBar } from '@/components/shared/UploadProgressBar';
import { useCreateSubmission } from '@/hooks/api/useSubmissions';
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/api/useTasks';
import type { FileInput } from '@/hooks/api/useUploads';
import { useFileUpload, validateFile } from '@/hooks/api/useUploads';
import { useProfile } from '@/hooks/api/useAuth';
import { UserRole } from '@/types/auth';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = id ?? '';
  const { theme } = useTheme();

  // Fetch task data from GET /tasks/{id}
  const {
    data: task,
    isLoading,
    isError,
    error,
    refetch,
  } = useTask(taskId);

  const { data: profile } = useProfile();

  // Submission and upload mutations
  const createSubmission = useCreateSubmission();
  const fileUpload = useFileUpload();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Submission modal state
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submissionComment, setSubmissionComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInput | null>(null);

  // Edit task state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMaxGrade, setEditMaxGrade] = useState('100');
  const [editType, setEditType] = useState<'ASSIGNMENT' | 'EXAM' | 'QUIZ' | 'NOTE'>('ASSIGNMENT');
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isSubmitted = (task as any)?.submissions?.length > 0;
  const submission = isSubmitted ? (task as any).submissions[0] : null;
  const isDeadlinePassed = task?.dueDate
    ? new Date(task.dueDate) < new Date()
    : false;
  const isGraded = submission?.status === 'GRADED' || submission?.status === 'RETURNED';

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/gif',
          'video/mp4',
          'video/quicktime',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const file: FileInput = {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size ?? undefined,
      };

      // Client-side validation
      const validationError = validateFile(file);
      if (validationError) {
        Alert.alert('Archivo no válido', validationError.message);
        return;
      }

      setSelectedFile(file);
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedFile) {
      Alert.alert('Archivo requerido', 'Por favor selecciona el archivo de tu tarea.');
      return;
    }

    if (isDeadlinePassed) {
      Alert.alert(
        'Fecha límite vencida',
        'No es posible enviar la tarea porque la fecha límite ya pasó.'
      );
      return;
    }

    try {
      // Upload file via POST /uploads
      const uploadResult = await fileUpload.upload(selectedFile);

      // Create or update submission via POST /submissions (backend uses upsert)
      await createSubmission.mutateAsync({
        taskId,
        fileUrl: uploadResult.fileUrl,
        content: submissionComment || undefined,
      });

      // Reset modal state
      setSubmitModalVisible(false);
      setSelectedFile(null);
      setSubmissionComment('');
      fileUpload.reset();

      Toast.show({
        type: 'success',
        text1: 'Tarea enviada',
        text2: 'Tu entrega se realizó correctamente.',
      });

      // Refetch task to show updated submission
      refetch();
    } catch (err: any) {
      fileUpload.reset();
      const message =
        err?.response?.data?.message || err?.message || 'No se pudo subir la tarea.';
      Alert.alert('Error al enviar', message);
    }
  };

  const handleCloseModal = () => {
    setSubmitModalVisible(false);
    setSelectedFile(null);
    setSubmissionComment('');
    fileUpload.reset();
  };

  const handleEditTask = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditMaxGrade(task.maxGrade?.toString() || '100');
    setEditType((task.type as any) || 'ASSIGNMENT');
    setEditDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setEditModalVisible(true);
  };

  const handleUpdateTask = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Campo requerido', 'El título de la tarea es obligatorio.');
      return;
    }
    const maxGrade = parseInt(editMaxGrade) || 100;
    try {
      await updateTask.mutateAsync({
        id: taskId,
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        maxGrade,
        type: editType,
        dueDate: editDueDate ? editDueDate.toISOString() : undefined,
      });
      setEditModalVisible(false);
      Toast.show({ type: 'success', text1: 'Tarea actualizada' });
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: 'Error al actualizar tarea' });
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Eliminar Tarea',
      '¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask.mutateAsync(taskId);
              Toast.show({ type: 'success', text1: 'Tarea eliminada' });
              router.back();
            } catch {
              Toast.show({ type: 'error', text1: 'Error al eliminar tarea' });
            }
          },
        },
      ]
    );
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Detalle de Tarea
              </Text>
            </View>
          </View>
          <SkeletonLoader variant="detail" rows={4} style={{ paddingHorizontal: 20 }} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Detalle de Tarea
              </Text>
            </View>
          </View>
          {error ? (
            <ErrorState
              error={error}
              onRetry={() => refetch()}
              onBack={() => router.back()}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="Tarea no encontrada"
              message="No se pudo encontrar la tarea solicitada."
              actionLabel="Volver"
              onAction={() => router.back()}
            />
          )}
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Determine if resubmission is allowed (submitted but not graded, and before deadline)
  const canResubmit = isSubmitted && !isGraded && !isDeadlinePassed;
  const canSubmit = !isSubmitted && !isDeadlinePassed;

  const isTeacher = profile?.role === UserRole.TEACHER || profile?.role === UserRole.SCHOOL_ADMIN || profile?.role === UserRole.SUPER_ADMIN;
  const isOwner = profile?.id === (task as any)?.project?.userId;
  const canActuallySubmit = (canSubmit || canResubmit) && !isTeacher && !isOwner;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Detalle de Tarea
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {(task as any)?.project?.name}
            </Text>
          </View>
          {(isTeacher || isOwner) && (
            <View style={styles.headerActions}>
              <Pressable onPress={handleEditTask} style={styles.headerActionBtn}>
                <Ionicons name="pencil" size={20} color={theme.colors.text} />
              </Pressable>
              <Pressable onPress={handleDeleteTask} style={styles.headerActionBtn}>
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Animated.View entering={FadeInDown.duration(500)}>
              <View style={styles.datesRow}>
                <View style={[styles.dateBox, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.dateText}>
                    Inicio:{' '}
                    {(task as any).createdAt
                      ? new Date((task as any).createdAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </View>
                <View style={[styles.dateBox, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="time-outline" size={16} color="#FF3B30" />
                  <Text style={styles.dateText}>
                    Límite:{' '}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : 'Pendiente'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.title, { color: theme.colors.text }]}>{task.title}</Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isDeadlinePassed && !isSubmitted
                      ? '#FFEBEE'
                      : isSubmitted
                        ? '#E8F5E9'
                        : '#FFF3E0',
                  },
                ]}
              >
                <Ionicons
                  name={
                    isDeadlinePassed && !isSubmitted
                      ? 'close-circle'
                      : isSubmitted
                        ? 'checkmark-done-circle'
                        : 'alert-circle'
                  }
                  size={18}
                  color={
                    isDeadlinePassed && !isSubmitted
                      ? '#C62828'
                      : isSubmitted
                        ? '#2E7D32'
                        : '#EF6C00'
                  }
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isDeadlinePassed && !isSubmitted
                        ? '#C62828'
                        : isSubmitted
                          ? '#2E7D32'
                          : '#EF6C00',
                    },
                  ]}
                >
                  {isDeadlinePassed && !isSubmitted
                    ? 'Fecha límite vencida'
                    : isSubmitted
                      ? 'Tarea Entregada'
                      : 'Pendiente de Entrega'}
                </Text>
              </View>

              {task.description ? (
                <Text style={[styles.description, { color: theme.colors.text }]}>
                  {task.description}
                </Text>
              ) : null}

              {/* Task Resources */}
              {(task as any)?.resources?.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Recursos de Apoyo
                  </Text>
                  {(task as any).resources.map((res: any) => (
                    <Pressable
                      key={res.id}
                      style={[styles.resCard, { backgroundColor: theme.colors.card }]}
                    >
                      <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                      <Text style={[styles.resName, { color: theme.colors.text }]}>
                        {res.name || res.fileName}
                      </Text>
                      <Ionicons
                        name="download-outline"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Submission Area */}
              <View style={styles.submissionArea}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Tu Entrega
                </Text>
                {isSubmitted ? (
                  <View style={[styles.subCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.subHeader}>
                      <Ionicons
                        name="document-text"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.subFileName, { color: theme.colors.text }]}>
                          {submission.fileUrl
                            ? submission.fileUrl.split('/').pop() || 'Archivo de entrega'
                            : 'Entrega de texto'}
                        </Text>
                        <Text
                          style={[styles.subDate, { color: theme.colors.textSecondary }]}
                        >
                          Enviado el{' '}
                          {new Date(submission.createdAt).toLocaleString()}
                        </Text>
                        {submission.updatedAt &&
                          submission.updatedAt !== submission.createdAt && (
                            <Text
                              style={[
                                styles.subDate,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              Actualizado el{' '}
                              {new Date(submission.updatedAt).toLocaleString()}
                            </Text>
                          )}
                      </View>
                      {submission.grade != null && (
                        <View
                          style={[
                            styles.gradeBadge,
                            { backgroundColor: theme.colors.primaryLight },
                          ]}
                        >
                          <Text
                            style={[styles.gradeText, { color: theme.colors.primary }]}
                          >
                            {submission.grade}
                          </Text>
                        </View>
                      )}
                    </View>
                    {submission.content ? (
                      <View
                        style={[
                          styles.commentSection,
                          { backgroundColor: theme.colors.background },
                        ]}
                      >
                        <Text
                          style={[
                            styles.feedbackTitle,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Tu comentario:
                        </Text>
                        <Text style={[styles.feedbackText, { color: theme.colors.text }]}>
                          {submission.content}
                        </Text>
                      </View>
                    ) : null}
                    {submission.feedback ? (
                      <View
                        style={[
                          styles.feedback,
                          { backgroundColor: theme.colors.background },
                        ]}
                      >
                        <Text
                          style={[
                            styles.feedbackTitle,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Feedback del Maestro:
                        </Text>
                        <Text style={[styles.feedbackText, { color: theme.colors.text }]}>
                          {submission.feedback}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={[styles.emptySub, { backgroundColor: theme.colors.card }]}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={32}
                      color={theme.colors.textSecondary}
                      style={{ opacity: 0.5 }}
                    />
                    <Text
                      style={[styles.emptySubText, { color: theme.colors.textSecondary }]}
                    >
                      {isDeadlinePassed
                        ? 'La fecha límite ha pasado'
                        : 'Sin entrega realizada'}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Submit / Resubmit button for students */}
        {canActuallySubmit && (
          <View style={styles.footer}>
            <Pressable
              onPress={() => setSubmitModalVisible(true)}
              style={[styles.mainBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="arrow-up-circle" size={24} color="#FFF" />
              <Text style={styles.mainBtnText}>
                {canResubmit ? 'Reenviar Tarea' : 'Subir Tarea'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* View Submissions button for teachers/owners */}
        {(isTeacher || isOwner) && (
          <View style={styles.footer}>
            <Pressable
              onPress={() => router.push({ pathname: '/tasks/[taskId]/submissions', params: { taskId: id } } as any)}
              style={[styles.mainBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="people-outline" size={24} color="#FFF" />
              <Text style={styles.mainBtnText}>Ver Entregas</Text>
            </Pressable>
          </View>
        )}

        {/* Upload Modal */}
        <Modal visible={submitModalVisible} animationType="slide" transparent>
          {/* ... existing upload modal ... */}
          <View style={styles.modalOverlay}>
            <Animated.View
              entering={FadeInUp}
              style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {canResubmit ? 'Reenviar Entrega' : 'Subir Entrega'}
                </Text>
                <Pressable onPress={handleCloseModal}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
              </View>

              {canResubmit && (
                <View style={[styles.resubmitNotice, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="information-circle" size={18} color="#EF6C00" />
                  <Text style={styles.resubmitNoticeText}>
                    Tu entrega anterior será reemplazada con esta nueva versión.
                  </Text>
                </View>
              )}

              {!selectedFile ? (
                <Pressable
                  onPress={handlePickFile}
                  style={[styles.filePicker, { borderColor: theme.colors.border }]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={40}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.filePickerText, { color: theme.colors.text }]}>
                    Seleccionar archivo (PDF, DOCX, JPG)
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.selectedFile,
                    { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Ionicons name="document" size={24} color={theme.colors.primary} />
                  <Text
                    style={[styles.selectedFileName, { color: theme.colors.primary }]}
                    numberOfLines={1}
                  >
                    {selectedFile.name}
                  </Text>
                  <Pressable onPress={() => setSelectedFile(null)}>
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </Pressable>
                </View>
              )}

              {/* Upload progress indicator */}
              {fileUpload.isUploading && (
                <UploadProgressBar
                  progress={fileUpload.progress}
                  status={fileUpload.status}
                  estimatedTimeRemaining={fileUpload.estimatedTimeRemaining}
                />
              )}

              {fileUpload.status === 'error' && (
                <UploadProgressBar
                  progress={fileUpload.progress}
                  status={fileUpload.status}
                />
              )}

              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Escribe un comentario opcional..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                value={submissionComment}
                onChangeText={setSubmissionComment}
              />

              <Pressable
                onPress={handleSubmitTask}
                disabled={
                  fileUpload.isUploading || createSubmission.isPending
                }
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity:
                      fileUpload.isUploading || createSubmission.isPending
                        ? 0.6
                        : 1,
                  },
                ]}
              >
                {fileUpload.isUploading || createSubmission.isPending ? (
                  <Text style={styles.submitBtnText}>
                    {fileUpload.isUploading ? 'Subiendo archivo...' : 'Enviando...'}
                  </Text>
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFF" />
                    <Text style={styles.submitBtnText}>Enviar Tarea</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* Edit Task Modal */}
        <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View 
              entering={FadeInUp}
              style={[styles.editModalCard, { backgroundColor: theme.colors.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Editar Tarea</Text>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text, marginBottom: 8 }]}>Título *</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                      placeholder="Título de la tarea"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={editTitle}
                      onChangeText={setEditTitle}
                    />
                  </View>

                  <View>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text, marginBottom: 8 }]}>Descripción</Text>
                    <TextInput
                      style={[styles.modalInput, styles.modalTextArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                      placeholder="Descripción o instrucciones"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={editDesc}
                      onChangeText={setEditDesc}
                      multiline
                    />
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Nota máxima</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                      value={editMaxGrade}
                      onChangeText={setEditMaxGrade}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>

                  <View>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text, marginBottom: 8 }]}>Fecha Límite</Text>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={[styles.modalInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                    >
                      <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                      <Text style={{ color: editDueDate ? theme.colors.text : theme.colors.textSecondary, fontSize: 15 }}>
                        {editDueDate
                          ? editDueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Sin fecha límite'}
                      </Text>
                      {editDueDate && (
                        <Pressable onPress={() => setEditDueDate(null)} style={{ marginLeft: 'auto' }}>
                          <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                        </Pressable>
                      )}
                    </Pressable>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={editDueDate ?? new Date()}
                      mode="date"
                      onChange={(event: any, date?: Date) => {
                        setShowDatePicker(false);
                        if (date) setEditDueDate(date);
                      }}
                    />
                  )}

                  <View>
                    <Text style={[styles.fieldLabel, { color: theme.colors.text, marginBottom: 8 }]}>Tipo</Text>
                    <View style={styles.typeRow}>
                      {(['ASSIGNMENT', 'EXAM', 'QUIZ', 'NOTE'] as const).map(t => (
                        <Pressable
                          key={t}
                          onPress={() => setEditType(t)}
                          style={[styles.typeBtn, { backgroundColor: editType === t ? theme.colors.primary : theme.colors.background, borderColor: theme.colors.border }]}
                        >
                          <Text style={[styles.typeBtnText, { color: editType === t ? '#FFF' : theme.colors.textSecondary }]}>
                            {t === 'ASSIGNMENT' ? 'Tarea' : t === 'EXAM' ? 'Examen' : t === 'QUIZ' ? 'Quiz' : 'Nota'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.modalBtns}>
                    <Pressable onPress={() => setEditModalVisible(false)} style={[styles.modalCancelBtn, { borderColor: theme.colors.border }]}>
                      <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleUpdateTask}
                      disabled={updateTask.isPending}
                      style={[styles.modalConfirmBtn, { backgroundColor: theme.colors.primary }]}
                    >
                      <Text style={styles.modalConfirmText}>{updateTask.isPending ? 'Guardando...' : 'Guardar Cambios'}</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, opacity: 0.7 },
  content: { paddingHorizontal: 20 },
  datesRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 6,
  },
  dateText: { fontSize: 11, fontWeight: '600', color: '#666' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 20,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  description: { fontSize: 15, lineHeight: 24, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  resCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    gap: 10,
  },
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
  commentSection: { marginTop: 12, padding: 16, borderRadius: 16 },
  feedback: { marginTop: 16, padding: 16, borderRadius: 16 },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  feedbackText: { fontSize: 14, lineHeight: 20 },
  footer: { padding: 20, position: 'absolute', bottom: 0, width: '100%' },
  mainBtn: {
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 450,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  resubmitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  resubmitNoticeText: { flex: 1, fontSize: 13, color: '#EF6C00', fontWeight: '600' },
  filePicker: {
    height: 120,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  filePickerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    gap: 12,
  },
  selectedFileName: { flex: 1, fontSize: 15, fontWeight: '700' },
  commentInput: {
    height: 100,
    borderRadius: 20,
    padding: 16,
    textAlignVertical: 'top',
    marginBottom: 30,
    fontSize: 14,
  },
  submitBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  editModalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12, minHeight: 500 },
  modalInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15 },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  smallInput: { width: 80, borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 16, textAlign: 'center', fontWeight: '800' },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  typeBtnText: { fontSize: 12, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 2, borderRadius: 14, padding: 14, alignItems: 'center' },
  modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
