import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface TaskFormData {
  title: string;
  description: string;
  type: 'ASSIGNMENT' | 'EXAM' | 'QUIZ' | 'NOTE';
  maxGrade: number;
  startDate: Date | null;
  dueDate: Date | null;
  resources: { id: string; name: string; url: string }[];
}

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export const TaskForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Guardar Tarea',
}: TaskFormProps) => {
  const { theme } = useTheme();

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<TaskFormData['type']>(initialData?.type || 'ASSIGNMENT');
  const [maxGrade, setMaxGrade] = useState(initialData?.maxGrade?.toString() || '100');
  const [startDate, setStartDate] = useState<Date | null>(initialData?.startDate || null);
  const [dueDate, setDueDate] = useState<Date | null>(initialData?.dueDate || null);
  const [resources, setResources] = useState(initialData?.resources || []);

  // Resource form state
  const [newResName, setNewResName] = useState('');
  const [newResUrl, setNewResUrl] = useState('');

  // Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<'start' | 'due'>('start');

  const handleShowPicker = (target: 'start' | 'due', mode: 'date' | 'time') => {
    setPickerTarget(target);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (pickerTarget === 'start') {
        setStartDate(selectedDate);
      } else {
        setDueDate(selectedDate);
      }
    }
  };

  const addResource = () => {
    if (!newResName.trim() || !newResUrl.trim()) return;
    setResources([...resources, { id: Date.now().toString(), name: newResName, url: newResUrl }]);
    setNewResName('');
    setNewResUrl('');
  };

  const removeResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
  };

  const handleFormSubmit = () => {
    onSubmit({
      title,
      description,
      type,
      maxGrade: parseInt(maxGrade) || 100,
      startDate,
      dueDate,
      resources,
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Title */}
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Título de la Tarea</Text>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Tarea de Matemáticas"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Description */}
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Instrucciones</Text>
      <View style={[styles.textAreaContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <TextInput
          style={[styles.textArea, { color: theme.colors.text }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Escribe las instrucciones aquí..."
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Type Selector */}
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Tipo de Tarea</Text>
      <View style={styles.typeRow}>
        {(['ASSIGNMENT', 'EXAM', 'QUIZ', 'NOTE'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[
              styles.typeBtn,
              {
                backgroundColor: type === t ? theme.colors.primary : theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.typeBtnText, { color: type === t ? '#FFF' : theme.colors.textSecondary }]}>
              {t === 'ASSIGNMENT' ? 'Tarea' : t === 'EXAM' ? 'Examen' : t === 'QUIZ' ? 'Quiz' : 'Nota'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Max Grade */}
      <View style={styles.fieldRow}>
        <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 0 }]}>Nota Máxima</Text>
        <TextInput
          style={[styles.smallInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
          value={maxGrade}
          onChangeText={setMaxGrade}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>

      {/* Dates */}
      <View style={styles.dateSection}>
        <View style={styles.dateColumn}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Inicio (Opcional)</Text>
          <Pressable
            onPress={() => handleShowPicker('start', 'date')}
            style={[styles.pickerBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.pickerText, { color: startDate ? theme.colors.text : theme.colors.textSecondary }]}>
              {startDate ? startDate.toLocaleDateString() : 'Seleccionar'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.dateColumn}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Entrega (Opcional)</Text>
          <Pressable
            onPress={() => handleShowPicker('due', 'date')}
            style={[styles.pickerBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
          >
            <Ionicons name="time-outline" size={18} color="#FF3B30" />
            <Text style={[styles.pickerText, { color: dueDate ? theme.colors.text : theme.colors.textSecondary }]}>
              {dueDate ? dueDate.toLocaleDateString() : 'Seleccionar'}
            </Text>
          </Pressable>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={(pickerTarget === 'start' ? startDate : dueDate) || new Date()}
          mode={pickerMode}
          is24Hour={true}
          onChange={onPickerChange}
        />
      )}

      {/* Resources */}
      <View style={styles.resourcesHeader}>
        <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 0 }]}>Recursos Adjuntos</Text>
        <Ionicons name="attach" size={20} color={theme.colors.primary} />
      </View>

      {resources.map((res) => (
        <View key={res.id} style={[styles.resItem, { backgroundColor: theme.colors.primary + '10' }]}>
          <Ionicons name="document-text" size={18} color={theme.colors.primary} />
          <Text style={[styles.resName, { color: theme.colors.text }]} numberOfLines={1}>{res.name}</Text>
          <Pressable onPress={() => removeResource(res.id)}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </Pressable>
        </View>
      ))}

      <View style={styles.addResBox}>
        <TextInput
          style={[styles.resInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Nombre del recurso"
          placeholderTextColor={theme.colors.textSecondary}
          value={newResName}
          onChangeText={setNewResName}
        />
        <TextInput
          style={[styles.resInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="URL del recurso"
          placeholderTextColor={theme.colors.textSecondary}
          value={newResUrl}
          onChangeText={setNewResUrl}
        />
        <Pressable onPress={addResource} style={[styles.addResBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.addResBtnText}>Añadir</Text>
        </Pressable>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <Pressable onPress={onCancel} style={[styles.btn, styles.cancelBtn, { borderColor: theme.colors.border }]}>
          <Text style={[styles.btnText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleFormSubmit}
          disabled={loading}
          style={[styles.btn, styles.submitBtn, { backgroundColor: theme.colors.primary }]}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{submitLabel}</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputContainer: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 20, justifyContent: 'center' },
  input: { fontSize: 15, fontWeight: '600' },
  textAreaContainer: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, minHeight: 100, marginBottom: 20 },
  textArea: { fontSize: 14, fontWeight: '500', textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  typeBtnText: { fontSize: 12, fontWeight: '700' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  smallInput: { width: 70, borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 16, textAlign: 'center', fontWeight: '800' },
  dateSection: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateColumn: { flex: 1 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  pickerText: { fontSize: 13, fontWeight: '600' },
  resourcesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, gap: 10 },
  resName: { flex: 1, fontSize: 13, fontWeight: '600' },
  addResBox: { gap: 8, marginBottom: 30 },
  resInput: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 13 },
  addResBtn: { height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addResBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 1 },
  submitBtn: {},
  btnText: { fontSize: 15, fontWeight: '700' },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
