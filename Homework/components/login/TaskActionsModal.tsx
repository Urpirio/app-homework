import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { BaseModal } from '../shared/BaseModal';

interface TaskActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  taskTitle?: string;
}

export const TaskActionsModal = ({ visible, onClose, onEdit, onDelete, taskTitle }: TaskActionsModalProps) => {
  const { theme } = useTheme();

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Opciones de Tarea</Text>
      {taskTitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {taskTitle}
        </Text>
      )}
      
      <View style={styles.optionsContainer}>
        <ActionButton 
          icon="create-outline" 
          label="Editar Tarea" 
          color={theme.colors.text}
          onPress={() => { onEdit(); onClose(); }} 
        />
        <ActionButton 
          icon="trash-outline" 
          label="Eliminar Tarea" 
          color={theme.colors.error}
          onPress={() => { onDelete(); onClose(); }} 
        />
      </View>
    </BaseModal>
  );
};

const ActionButton = ({ icon, label, color, onPress }: any) => {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: pressed ? theme.colors.border + '50' : 'transparent' }
      ]}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.actionLabel, { color: color }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  optionsContainer: {
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
});
