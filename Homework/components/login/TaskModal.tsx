import { useTheme } from '@/hooks/useTheme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Platform } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface TaskData {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'todo' | 'in-progress' | 'done';
}

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: TaskData) => void;
  initialData?: TaskData | null;
}

export const TaskModal = ({ visible, onClose, onSave, initialData }: TaskModalProps) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      // Intentar parsear la fecha si existe
      if (initialData.dueDate) {
        const d = new Date(initialData.dueDate);
        if (!isNaN(d.getTime())) setDate(d);
      }
      setStatus(initialData.status);
    } else {
      setTitle('');
      setDescription('');
      setDate(new Date());
      setStatus('todo');
    }
  }, [initialData, visible]);

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
        dueDate: date.toISOString(), // Guardamos ISO para mayor precisión
        status 
      });
      onClose();
    }
  };

  const isEditing = !!initialData;

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            active={status === 'todo'} 
            onPress={() => setStatus('todo')} 
            color={theme.colors.border}
          />
          <StatusOption 
            label="En curso" 
            active={status === 'in-progress'} 
            onPress={() => setStatus('in-progress')} 
            color={theme.colors.primary}
          />
          <StatusOption 
            label="Listo" 
            active={status === 'done'} 
            onPress={() => setStatus('done')} 
            color={theme.colors.success}
          />
        </View>

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
});
