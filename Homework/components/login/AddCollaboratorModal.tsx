import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BaseModal } from '../shared/BaseModal';
import api from '@/utils/api';

interface AddCollaboratorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (collaborator: any) => void;
  currentCollaborators: any[];
}

export const AddCollaboratorModal = ({ 
  visible, 
  onClose, 
  onSelect,
  currentCollaborators 
}: AddCollaboratorModalProps) => {
  const { theme } = useTheme();
  const [availableCollabs, setAvailableCollabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAvailableCollabs();
    }
  }, [visible]);

  const fetchAvailableCollabs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/collaborators');
      
      // Filtrar solo los que están activos y NO están ya en el proyecto
      const active = res.data
        .filter((c: any) => c.status === 'ACTIVE')
        .map((c: any) => ({
          id: c.collaborator.id,
          name: c.collaborator.fullName,
          avatar: c.collaborator.avatarUrl,
        }))
        .filter((col: any) => !currentCollaborators.some(existing => existing.id === col.id));

      setAvailableCollabs(active);
    } catch (error) {
      console.error('Error fetching available collabs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Añadir al Proyecto</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Selecciona un colaborador para este proyecto
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : availableCollabs.length > 0 ? (
        <FlatList
          data={availableCollabs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.collabItem, { backgroundColor: theme.colors.background }]}
              onPress={() => onSelect(item)}
            >
              <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                    {item.name?.charAt(0)}
                  </Text>
                )}
              </View>
              <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No hay colaboradores disponibles para añadir.
          </Text>
        </View>
      )}
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  loader: {
    padding: 40,
  },
  list: {
    paddingBottom: 20,
  },
  collabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  }
});
