import { useTheme } from '@/hooks/useTheme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from '../login/AnimatedInput';
import { AnimatedButton } from '../login/AnimatedButton';

interface ProjectData {
  id?: string;
  name: string;
  description: string;
  color: string;
}

interface ProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ProjectData) => void;
  initialData?: ProjectData | null;
}

const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#34C759', '#FF2D55', '#AF52DE', '#5AC8FA'];

export const ProjectModal = ({ visible, onClose, onSave, initialData }: ProjectModalProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setColor(initialData.color || COLORS[0]);
    } else {
      setName('');
      setDescription('');
      setColor(COLORS[0]);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({ 
        id: initialData?.id, 
        name, 
        description, 
        color 
      });
      onClose();
    }
  };

  const isEditing = !!initialData;

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </Text>
        
        <View style={styles.inputContainer}>
          <AnimatedInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre del proyecto"
            icon="folder-outline"
          />
          
          <AnimatedInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción"
            icon="document-text-outline"
          />
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Color del proyecto</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <Pressable 
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.colorOption, 
                { backgroundColor: c, borderColor: color === c ? theme.colors.text : 'transparent' }
              ]}
            >
              {color === c && <View style={styles.colorSelected} />}
            </Pressable>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <AnimatedButton
            title={isEditing ? "Guardar Cambios" : "Crear Proyecto"}
            onPress={handleSave}
            disabled={!name.trim()}
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
