/**
 * Create Ticket Screen
 *
 * Support ticket creation form with Zod validation, file attachment,
 * and draft auto-save.
 *
 * Validates: Requirements 15.1, 15.2, 15.3
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { UploadProgressBar } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useCreateTicket } from '@/hooks/api/useTickets';
import { useFileUpload } from '@/hooks/api/useUploads';
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave';
import { useForm } from '@/hooks/useForm';
import { useTheme } from '@/hooks/useTheme';
import { ticketSchema, type TicketFormValues } from '@/validation/schemas';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = ['Technical', 'Academic', 'Account', 'General'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  Technical: 'Técnico',
  Academic: 'Académico',
  Account: 'Cuenta',
  General: 'General',
};
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Technical: 'construct-outline',
  Academic: 'school-outline',
  Account: 'person-outline',
  General: 'help-circle-outline',
};

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
const PRIORITY_LABELS: Record<string, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
  Critical: 'Crítica',
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: '#34C759',
  Medium: '#FF9500',
  High: '#FF3B30',
  Critical: '#AF52DE',
};

const INITIAL_VALUES: TicketFormValues = {
  title: '',
  description: '',
  category: '',
};

interface AttachmentFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export default function CreateTicketScreen() {
  const { theme } = useTheme();
  const createTicket = useCreateTicket();
  const fileUpload = useFileUpload();
  const [priority, setPriority] = useState<string>('Medium');
  const [attachment, setAttachment] = useState<AttachmentFile | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm(ticketSchema, INITIAL_VALUES);

  const draftValues = {
    ...form.values,
    priority,
  } as Record<string, unknown>;

  const { loadDraft, clearDraft } = useDraftAutoSave({
    formType: 'ticket',
    values: draftValues,
    debounceMs: 3000,
  });

  // Load draft on mount
  useEffect(() => {
    (async () => {
      const draft = await loadDraft();
      if (draft) {
        if (draft.title) form.handleChange('title', draft.title as string);
        if (draft.description) form.handleChange('description', draft.description as string);
        if (draft.category) form.handleChange('category', draft.category as string);
        if (draft.priority) setPriority(draft.priority as string);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        setAttachment({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          size: file.size,
        });
        setUploadedFileUrl(null);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error al seleccionar archivo' });
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setUploadedFileUrl(null);
    fileUpload.reset();
  };

  const handleSubmit = async () => {
    const isValid = form.handleSubmit();
    if (!isValid) return;

    setSubmitting(true);
    try {
      // Upload attachment first if present
      let fileUrl: string | undefined;
      if (attachment && !uploadedFileUrl) {
        const uploadResult = await fileUpload.upload({
          uri: attachment.uri,
          name: attachment.name,
          mimeType: attachment.mimeType,
          size: attachment.size,
        });
        fileUrl = uploadResult.fileUrl;
        setUploadedFileUrl(fileUrl);
      } else if (uploadedFileUrl) {
        fileUrl = uploadedFileUrl;
      }

      const ticket = await createTicket.mutateAsync({
        title: form.values.title,
        description: form.values.description,
        category: form.values.category,
        priority,
        ...(fileUrl ? { fileUrl } : {}),
      });

      await clearDraft();

      // Show confirmation with tracking info
      const expectedTime = priority === 'Critical' ? '1 hora' :
        priority === 'High' ? '2 horas' :
        priority === 'Medium' ? '24 horas' : '48 horas';

      Alert.alert(
        'Ticket Creado',
        `Tu ticket ha sido creado exitosamente.\n\nNúmero de seguimiento: #${ticket.id.slice(0, 8).toUpperCase()}\nTiempo estimado de respuesta: ${expectedTime}`,
        [{ text: 'Aceptar', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error al crear ticket',
        text2: error?.message || 'Intenta de nuevo más tarde',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const horizontalPadding = SCREEN_WIDTH > 400 ? 24 : 16;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Crear Ticket de Soporte
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Picker */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Categoría</Text>
            <View style={styles.segmentRow}>
              {CATEGORIES.map((cat) => {
                const selected = form.values.category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => form.handleChange('category', cat)}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.card,
                        borderColor: selected ? theme.colors.primary : theme.colors.border + '40',
                      },
                    ]}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[cat]}
                      size={18}
                      color={selected ? '#FFF' : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: selected ? '#FFF' : theme.colors.textSecondary },
                      ]}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {form.touched.category && form.errors.category && (
              <Text style={styles.errorText}>{form.errors.category}</Text>
            )}
          </Animated.View>

          {/* Priority Picker */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Prioridad</Text>
            <View style={styles.segmentRow}>
              {PRIORITIES.map((p) => {
                const selected = priority === p;
                const color = PRIORITY_COLORS[p];
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: selected ? color + '20' : theme.colors.card,
                        borderColor: selected ? color : theme.colors.border + '40',
                      },
                    ]}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: color }]} />
                    <Text
                      style={[
                        styles.segmentText,
                        { color: selected ? color : theme.colors.textSecondary },
                      ]}
                    >
                      {PRIORITY_LABELS[p]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Title Input */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Asunto</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: form.touched.title && form.errors.title
                    ? '#FF3B30'
                    : theme.colors.border + '40',
                },
              ]}
              placeholder="Describe brevemente el problema"
              placeholderTextColor={theme.colors.textSecondary}
              value={form.values.title}
              onChangeText={(text) => form.handleChange('title', text)}
              onBlur={() => form.handleBlur('title')}
              maxLength={200}
            />
            {form.touched.title && form.errors.title && (
              <Text style={styles.errorText}>{form.errors.title}</Text>
            )}
          </Animated.View>

          {/* Description Input */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Descripción</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: form.touched.description && form.errors.description
                    ? '#FF3B30'
                    : theme.colors.border + '40',
                },
              ]}
              placeholder="Proporciona detalles sobre el problema..."
              placeholderTextColor={theme.colors.textSecondary}
              value={form.values.description}
              onChangeText={(text) => form.handleChange('description', text)}
              onBlur={() => form.handleBlur('description')}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={2000}
            />
            {form.touched.description && form.errors.description && (
              <Text style={styles.errorText}>{form.errors.description}</Text>
            )}
            <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
              {form.values.description.length}/2000
            </Text>
          </Animated.View>

          {/* Attachment Section */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Adjuntos (opcional)</Text>
            {attachment ? (
              <View style={[styles.attachmentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '40' }]}>
                <Ionicons name="document-attach-outline" size={24} color={theme.colors.primary} />
                <View style={styles.attachmentInfo}>
                  <Text style={[styles.attachmentName, { color: theme.colors.text }]} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  {attachment.size && (
                    <Text style={[styles.attachmentSize, { color: theme.colors.textSecondary }]}>
                      {(attachment.size / 1024 / 1024).toFixed(1)} MB
                    </Text>
                  )}
                </View>
                <Pressable onPress={handleRemoveAttachment} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickAttachment}
                style={[styles.attachBtn, { borderColor: theme.colors.border + '60', backgroundColor: theme.colors.card }]}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.attachBtnText, { color: theme.colors.primary }]}>
                  Seleccionar archivo
                </Text>
              </Pressable>
            )}
            {fileUpload.isUploading && (
              <View style={{ marginTop: 8 }}>
                <UploadProgressBar progress={fileUpload.progress} status={fileUpload.status} />
              </View>
            )}
            {fileUpload.validationError && (
              <Text style={styles.errorText}>{fileUpload.validationError.message}</Text>
            )}
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || fileUpload.isUploading}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: submitting ? theme.colors.border : theme.colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {submitting ? (
                <Text style={styles.submitBtnText}>Enviando...</Text>
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>Enviar Ticket</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  attachBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentSize: {
    fontSize: 11,
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 28,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
