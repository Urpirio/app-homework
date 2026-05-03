import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditTaskScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date());
  const [resources, setResources] = useState<{ id: string, name: string, url: string }[]>([]);
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Picker states
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<'start' | 'deadline'>('start');

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setTitle(res.data.title);
      setDescription(res.data.description);
      setStartDate(res.data.startDate ? new Date(res.data.startDate) : new Date());
      setDeadline(res.data.deadline ? new Date(res.data.deadline) : new Date());
      setResources(res.data.resources || []);
    } catch (error) {
      // Mock data
      setTitle('Ecuaciones de Segundo Grado');
      setDescription('Resolver los ejercicios de la página 45 del libro de texto y subir una foto del procedimiento.');
      setStartDate(new Date('2026-05-01T10:00:00'));
      setDeadline(new Date('2026-05-10T23:59:00'));
      setResources([
        { id: 'r1', name: 'Guía de Fórmulas', url: 'https://example.com/guia.pdf' }
      ]);
    } finally {
      setFetching(false);
    }
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (pickerTarget === 'start') {
        setStartDate(selectedDate);
      } else {
        setDeadline(selectedDate);
      }
    }
  };

  const showDatePicker = (target: 'start' | 'deadline', mode: 'date' | 'time') => {
    setPickerTarget(target);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const addResource = () => {
    if (!newResourceName.trim() || !newResourceUrl.trim()) return;
    const newRes = {
      id: Date.now().toString(),
      name: newResourceName,
      url: newResourceUrl
    };
    setResources([...resources, newRes]);
    setNewResourceName('');
    setNewResourceUrl('');
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Campos requeridos',
        text2: 'Por favor completa el título y la descripción',
      });
      return;
    }

    if (deadline < startDate) {
      Toast.show({
        type: 'error',
        text1: 'Fecha inválida',
        text2: 'La fecha límite no puede ser anterior a la de inicio',
      });
      return;
    }

    try {
      setLoading(true);
      await api.put(`/tasks/${taskId}`, { 
        title, 
        description, 
        startDate: startDate.toISOString(),
        deadline: deadline.toISOString(),
        resources 
      });
      
      Toast.show({
        type: 'success',
        text1: 'Tarea actualizada',
        text2: 'Los cambios se han guardado correctamente',
      });
      
      router.back();
    } catch (error) {
      // Mock success
      Toast.show({
        type: 'success',
        text1: 'Tarea actualizada (Mock)',
        text2: 'Los cambios se han guardado correctamente',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Editar Tarea</Text>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Título de la Tarea</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Tarea 1"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Fecha Inicio</Text>
                <Pressable 
                  onPress={() => showDatePicker('start', 'date')}
                  style={[styles.pickerBtn, { backgroundColor: theme.colors.card }]}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.pickerBtnText, { color: theme.colors.text }]}>
                    {startDate.toLocaleDateString('es-ES')}
                  </Text>
                </Pressable>
                <Pressable 
                  onPress={() => showDatePicker('start', 'time')}
                  style={[styles.pickerBtn, { backgroundColor: theme.colors.card, marginTop: 8 }]}
                >
                  <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.pickerBtnText, { color: theme.colors.text }]}>
                    {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Fecha Límite</Text>
                <Pressable 
                  onPress={() => showDatePicker('deadline', 'date')}
                  style={[styles.pickerBtn, { backgroundColor: theme.colors.card }]}
                >
                  <Ionicons name="calendar-outline" size={18} color="#FF3B30" />
                  <Text style={[styles.pickerBtnText, { color: theme.colors.text }]}>
                    {deadline.toLocaleDateString('es-ES')}
                  </Text>
                </Pressable>
                <Pressable 
                  onPress={() => showDatePicker('deadline', 'time')}
                  style={[styles.pickerBtn, { backgroundColor: theme.colors.card, marginTop: 8 }]}
                >
                  <Ionicons name="time-outline" size={18} color="#FF3B30" />
                  <Text style={[styles.pickerBtnText, { color: theme.colors.text }]}>
                    {deadline.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>
            </View>

            {showPicker && (
              <DateTimePicker
                value={pickerTarget === 'start' ? startDate : deadline}
                mode={pickerMode}
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPickerChange}
              />
            )}

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Descripción / Instrucciones</Text>
            <View style={[styles.textAreaContainer, { backgroundColor: theme.colors.card }]}>
              <TextInput
                style={[styles.textArea, { color: theme.colors.text }]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="Escribe las instrucciones aquí..."
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.resourcesHeader}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Recursos de Apoyo</Text>
              <Ionicons name="attach" size={20} color={theme.colors.primary} />
            </View>
            
            {resources.map((res) => (
              <View key={res.id} style={[styles.resourceItem, { backgroundColor: theme.colors.primary + '10' }]}>
                <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.resourceName, { color: theme.colors.text }]} numberOfLines={1}>{res.name}</Text>
                </View>
                <Pressable onPress={() => removeResource(res.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </Pressable>
              </View>
            ))}

            <View style={styles.addResourceBox}>
              <TextInput
                style={[styles.resInput, { color: theme.colors.text, backgroundColor: theme.colors.card }]}
                placeholder="Nombre del recurso"
                placeholderTextColor={theme.colors.textSecondary}
                value={newResourceName}
                onChangeText={setNewResourceName}
              />
              <TextInput
                style={[styles.resInput, { color: theme.colors.text, backgroundColor: theme.colors.card }]}
                placeholder="URL del recurso"
                placeholderTextColor={theme.colors.textSecondary}
                value={newResourceUrl}
                onChangeText={setNewResourceUrl}
              />
              <Pressable 
                style={[styles.addResBtn, { backgroundColor: theme.colors.primary }]}
                onPress={addResource}
              >
                <Text style={styles.addResBtnText}>Añadir Recurso</Text>
              </Pressable>
            </View>

            <Pressable 
              style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Guardar Cambios</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginLeft: 4 },
  inputContainer: { borderRadius: 18, paddingHorizontal: 16, height: 56, marginBottom: 24, justifyContent: 'center' },
  input: { fontSize: 16, fontWeight: '600' },
  textAreaContainer: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, height: 160, marginBottom: 30 },
  textArea: { flex: 1, fontSize: 15, fontWeight: '500' },
  submitBtn: { height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  pickerBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  resourcesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 10 },
  resourceItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15, marginBottom: 8 },
  resourceName: { fontSize: 14, fontWeight: '600' },
  addResourceBox: { marginTop: 10, gap: 10, marginBottom: 30 },
  resInput: { height: 44, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  addResBtn: { height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addResBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
