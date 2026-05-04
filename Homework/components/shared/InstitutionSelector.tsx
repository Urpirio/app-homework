/**
 * InstitutionSelector
 *
 * Dropdown selector for SUPER_ADMIN users to switch between institutions.
 * Fetches the institution list from the backend and updates InstitutionContext
 * on selection change.
 *
 * Not rendered for SCHOOL_ADMIN users (they have a fixed institution).
 *
 * Validates: Requirements 7.6
 */

import { useInstitution } from '@/hooks/useInstitution';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface Institution {
  id: string;
  name: string;
  logoUrl?: string;
}

export function InstitutionSelector() {
  const { theme } = useTheme();
  const { institutionId, setInstitutionId } = useInstitution();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchInstitutions() {
      try {
        const response = await api.get('/institutions');
        if (!cancelled) {
          const data = Array.isArray(response.data)
            ? response.data
            : response.data?.data ?? [];
          setInstitutions(data);

          // Auto-select the first institution if none is selected
          if (!institutionId && data.length > 0) {
            setInstitutionId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching institutions:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInstitutions();

    return () => {
      cancelled = true;
    };
    // Only run on mount — institutionId is intentionally excluded to avoid
    // re-fetching when the user switches institutions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedInstitution = institutions.find((i) => i.id === institutionId);
  const displayName = selectedInstitution?.name ?? 'Seleccionar Institución';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (institutions.length === 0) {
    return null;
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border + '50',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Institución seleccionada: ${displayName}. Toca para cambiar.`}
      >
        <Ionicons name="business" size={18} color={theme.colors.primary} />
        <Text
          style={[styles.label, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.colors.textSecondary}
        />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Seleccionar Institución
            </Text>

            <FlatList
              data={institutions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === institutionId;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionRow,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary + '15'
                          : pressed
                            ? theme.colors.border + '20'
                            : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setInstitutionId(item.id);
                      setModalVisible(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color={
                        isSelected
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                );
              }}
              style={styles.list}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    maxHeight: '60%',
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    maxHeight: 300,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    marginBottom: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
});
