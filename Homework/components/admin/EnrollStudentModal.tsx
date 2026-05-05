import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BaseModal } from '../shared/BaseModal';
import { useUsers, useEnrollStudent } from '@/hooks/api/useUsers';
import { useAddStudentToClassroom } from '@/hooks/api/useClassrooms';
import Toast from 'react-native-toast-message';

interface EnrollStudentModalProps {
  visible: boolean;
  onClose: () => void;
  institutionId: string;
  classroomId: string;
}

type Mode = 'search' | 'create';

export const EnrollStudentModal = ({
  visible,
  onClose,
  institutionId,
  classroomId,
}: EnrollStudentModalProps) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>('search');
  const [search, setSearch] = useState('');

  // Mutations
  const enrollNew = useEnrollStudent();
  const assignExisting = useAddStudentToClassroom(classroomId);

  // Search existing students
  const { data: usersData, isLoading: searching } = useUsers({
    role: 'STUDENT',
    institutionId,
    search: search.length > 2 ? search : undefined,
  });

  const students = usersData?.pages.flatMap((page) => page.data) || [];

  // Create form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const handleEnrollNew = async () => {
    if (!fullName.trim() || !email.trim()) return;
    try {
      await enrollNew.mutateAsync({
        institutionId,
        fullName,
        email,
        classroomId,
      });
      Toast.show({ type: 'success', text1: 'Estudiante inscrito' });
      resetAndClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'No se pudo inscribir',
      });
    }
  };

  const handleAssignExisting = async (studentId: string) => {
    try {
      await assignExisting.mutateAsync(studentId);
      Toast.show({ type: 'success', text1: 'Estudiante asignado' });
      resetAndClose();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'No se pudo asignar',
      });
    }
  };

  const resetAndClose = () => {
    setMode('search');
    setSearch('');
    setFullName('');
    setEmail('');
    onClose();
  };

  return (
    <BaseModal visible={visible} onClose={resetAndClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Inscribir Estudiante</Text>

        <View style={styles.modeTabs}>
          <Pressable
            onPress={() => setMode('search')}
            style={[
              styles.modeTab,
              mode === 'search' && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.modeLabel, { color: mode === 'search' ? theme.colors.primary : theme.colors.textSecondary }]}>
              Buscar Existente
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('create')}
            style={[
              styles.modeTab,
              mode === 'create' && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.modeLabel, { color: mode === 'create' ? theme.colors.primary : theme.colors.textSecondary }]}>
              Inscribir Nuevo
            </Text>
          </Pressable>
        </View>

        {mode === 'search' ? (
          <View style={styles.searchContainer}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Nombre o email..."
                placeholderTextColor={theme.colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {searching ? (
              <ActivityIndicator style={{ margin: 20 }} color={theme.colors.primary} />
            ) : (
              <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleAssignExisting(item.id)}
                    style={[styles.userItem, { borderBottomColor: theme.colors.border }]}
                  >
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: theme.colors.text }]}>{item.fullName}</Text>
                      <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{item.email}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                  </Pressable>
                )}
                ListEmptyComponent={() => (
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    {search.length > 2 ? 'No se encontraron estudiantes' : 'Escribe al menos 3 letras para buscar'}
                  </Text>
                )}
              />
            )}
          </View>
        ) : (
          <View style={styles.createContainer}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Nombre completo"
                placeholderTextColor={theme.colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, marginTop: 12 }]}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Email institucional"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Pressable
              onPress={handleEnrollNew}
              disabled={enrollNew.isPending}
              style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
            >
              {enrollNew.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Inscribir Estudiante</Text>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  modeTabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  modeLabel: { fontSize: 13, fontWeight: '700' },
  searchContainer: { minHeight: 200, maxHeight: 400 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, borderRadius: 12, borderWidth: 1, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  list: { marginTop: 12 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  createContainer: { paddingBottom: 10 },
  submitBtn: { height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
