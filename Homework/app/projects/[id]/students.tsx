import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useProjectMembers } from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const SubjectStudentsScreen = () => {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const { data: profile } = useProfile();
  const isTeacher = profile?.role === 'TEACHER' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'SCHOOL_ADMIN';
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {
    data: members,
    isLoading,
    isError,
    error,
    refetch,
  } = useProjectMembers(id ?? '');

  const students = useMemo(() => {
    if (!members) return [];
    
    const uniqueStudents = new Map();
    members
      .filter((m) => m.role === 'student')
      .forEach((m) => {
        if (!uniqueStudents.has(m.user.id)) {
          uniqueStudents.set(m.user.id, {
            id: m.user.id,
            name: m.user.fullName,
            avatar: m.user.avatarUrl,
            email: m.user.email,
          });
        }
      });
    
    return Array.from(uniqueStudents.values());
  }, [members]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const query = search.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(query));
  }, [students, search]);

  const handleStudentPress = (student: { id: string; name: string; avatar?: string }) => {
    setSelectedStudent(student);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Alumnos</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {name || 'Materia'}
              </Text>
            </View>
            {isTeacher ? (
              <Pressable
                onPress={() => router.push(`/projects/${id}/attendance`)}
                style={[styles.attendanceButton, { backgroundColor: '#34C75915' }]}
              >
                <Ionicons name="people-outline" size={20} color="#34C759" />
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {isLoading ? (
            <SkeletonLoader rows={6} variant="list-item" style={{ marginTop: 10 }} />
          ) : isError ? (
            <ErrorState
              error={error!}
              onRetry={() => refetch()}
              style={styles.stateContainer}
            />
          ) : students.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Sin alumnos"
              message="Esta materia aún no tiene alumnos inscritos."
              style={styles.stateContainer}
            />
          ) : (
            <>
              <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder="Buscar alumno..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                  <EmptyState
                    icon="search-outline"
                    title="Sin resultados"
                    message={`No se encontraron alumnos con "${search}".`}
                    style={styles.emptySearch}
                  />
                }
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 50)}>
                    <Pressable
                      onPress={() => handleStudentPress(item)}
                      style={({ pressed }) => [
                        styles.studentCard,
                        { 
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border + '40',
                          opacity: pressed ? 0.9 : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }]
                        }
                      ]}
                    >
                      <View
                        style={[
                          styles.avatarContainer,
                          { backgroundColor: theme.colors.primaryLight },
                        ]}
                      >
                        {item.avatar ? (
                          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                        ) : (
                          <Text
                            style={[styles.avatarText, { color: theme.colors.primary }]}
                          >
                            {item.name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: theme.colors.text }]}>
                          {item.name}
                        </Text>
                        <View style={styles.roleBadge}>
                          <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                          <Text
                            style={[styles.studentRole, { color: theme.colors.textSecondary }]}
                          >
                            Estudiante Activo
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.actionIcon, { backgroundColor: theme.colors.background }]}>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={theme.colors.primary}
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                )}
              />
            </>
          )}
        </View>

        {/* Modal Conexión */}
        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View
              entering={FadeInUp}
              style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
            >
              <View
                style={[styles.modalAvatar, { backgroundColor: theme.colors.primaryLight }]}
              >
                <Text style={[styles.modalAvatarText, { color: theme.colors.primary }]}>
                  {selectedStudent?.name.charAt(0)}
                </Text>
              </View>
              <Text style={[styles.modalName, { color: theme.colors.text }]}>
                {selectedStudent?.name}
              </Text>
              <Text
                style={{
                  textAlign: 'center',
                  marginBottom: 25,
                  color: theme.colors.textSecondary,
                }}
              >
                Aún no están conectados.
              </Text>
              <View style={{ width: '100%', gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setIsModalVisible(false);
                    Toast.show({ type: 'success', text1: 'Solicitud enviada' });
                  }}
                  style={[styles.primaryAction, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Enviar Solicitud</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIsModalVisible(false);
                    router.push({
                      pathname: '/collaborator/[id]',
                      params: {
                        id: selectedStudent?.id ?? '',
                        name: selectedStudent?.name ?? '',
                      },
                    });
                  }}
                  style={[styles.secondaryAction, { borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                    Ver Perfil Académico
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={{ alignItems: 'center', padding: 10 }}
                >
                  <Text style={{ color: theme.colors.textSecondary }}>Cancelar</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
};

export default SubjectStudentsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  attendanceButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  stateContainer: { flex: 1, paddingTop: 40 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00000005',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  emptySearch: { paddingTop: 40 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  studentInfo: { flex: 1, marginLeft: 16 },
  studentName: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  studentRole: { fontSize: 13, fontWeight: '600' },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatarText: { fontSize: 32, fontWeight: '900' },
  modalName: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  primaryAction: { padding: 16, borderRadius: 18, alignItems: 'center' },
  secondaryAction: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
});
