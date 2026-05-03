import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { BaseModal } from '../shared/BaseModal';

interface EnrollmentOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'BULK' | 'SINGLE' | 'STAFF') => void;
}

export const EnrollmentOptionsModal = ({ visible, onClose, onSelectOption }: EnrollmentOptionsModalProps) => {
  const { theme } = useTheme();

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Inscripción de Alumnos</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Elige cómo deseas añadir nuevos estudiantes a esta institución.
      </Text>

      <View style={styles.optionsContainer}>
        <OptionItem 
          title="Inscripción Masiva" 
          subtitle="Subir archivo Excel (.xlsx)" 
          icon="document-attach" 
          onPress={() => onSelectOption('BULK')} 
        />
        <OptionItem 
          title="Estudiante Individual" 
          subtitle="Registro manual con formulario" 
          icon="person-add" 
          onPress={() => onSelectOption('SINGLE')} 
        />
        <OptionItem 
          title="Carga por Lote" 
          subtitle="Copiar y pegar listado" 
          icon="list" 
          onPress={() => onSelectOption('STAFF')} 
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
