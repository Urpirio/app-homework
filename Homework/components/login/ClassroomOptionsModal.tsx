import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { BaseModal } from '../shared/BaseModal';

interface ClassroomOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'BULK' | 'SINGLE') => void;
}

export const ClassroomOptionsModal = ({ visible, onClose, onSelectOption }: ClassroomOptionsModalProps) => {
  const { theme } = useTheme();

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Gestión de Aulas</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Configura los espacios de aprendizaje para esta institución.
      </Text>

      <View style={styles.optionsContainer}>
        <OptionItem 
          title="Creación Masiva" 
          subtitle="Importar aulas desde Excel" 
          icon="copy" 
          onPress={() => onSelectOption('BULK')} 
        />
        <OptionItem 
          title="Aula Individual" 
          subtitle="Configuración manual detallada" 
          icon="add-circle" 
          onPress={() => onSelectOption('SINGLE')} 
        />
      </View>
    </BaseModal>
  );
};

const OptionItem = ({ title, subtitle, icon, onPress }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable style={[styles.option, { backgroundColor: theme.colors.primaryLight }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.optionInfo}>
        <Text style={[styles.optionTitle, { color: theme.colors.primary }]}>{title}</Text>
        <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  optionsContainer: { gap: 12, marginBottom: 20 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20 },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700' },
  optionSubtitle: { fontSize: 12, marginTop: 2 },
});
