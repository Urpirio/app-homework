import { AdminEnrollmentModal } from '@/components/login/AdminEnrollmentModal';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { BaseModal } from '@/components/shared/BaseModal';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import {
    useDeleteInstitution,
    useInstitution,
    useRemoveAdmin,
} from '@/hooks/api/useInstitutions';
import { useUsers } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function InstitutionSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [instDeleteModalVisible, setInstDeleteModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  const {
    data: institution,
    isLoading,
    isError,
    error,
    refetch,
  } = useInstitution(id!);

  // Fetch users with SCHOOL_ADMIN role for this institution to display admins
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useUsers({ institutionId: id!, role: 'SCHOOL_ADMIN' as any });

  const admins = useMemo(
    () => usersData?.pages.flatMap((p) => p.data) ?? [],
    [usersData]
  );

  const removeAdminMutation = useRemoveAdmin();
  const deleteInstitutionMutation = useDeleteInstitution();

  const confirmDeleteAdmin = (admin: any) => {
    setSelectedAdmin(admin);
    setDeleteModalVisible(true);
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    try {
      await removeAdminMutation.mutateAsync({
        institutionId: id!,
        adminId: selectedAdmin.id,
      });
      Toast.show({ type: 'success', text1: 'Administrador eliminado' });
      refetchUsers();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'No se pudo eliminar el administrador',
      });
    } finally {
      setDeleteModalVisible(false);
      setSelectedAdmin(null);
    }
  };

  const handleDeleteInstitution = async () => {
    try {
      await deleteInstitutionMutation.mutateAsync(id!);
      setInstDeleteModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Institución desactivada',
        text2: 'La institución ha sido puesta en modo inactivo.',
      });
      setTimeout(() => router.replace('/admin/dashboard' as any), 1500);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'No se pudo desactivar la institución',
      });
    }
  };

  const handleAdminAdded = () => {
    refetchUsers();
    refetch();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Configuración</Text>
          </View>
          <SkeletonLoader rows={4} variant="list-item" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Configuración</Text>
          </View>
          <ErrorState error={error!} onRetry={() => refetch()} />
        </ThemedView>
      </SafeAreaView>
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Configuración</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Institution Edit Entry */}
          <Pressable
            onPress={() => router.push(`/admin/institution/${id}/edit`)}
            style={[styles.menuItem, { backgroundColor: theme.colors.card }]}
            accessibilityRole="button"
            accessibilityLabel="Editar información institucional"
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="business" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: theme.colors.text }]}>Información Institucional</Text>
              <Text style={[styles.menuSub, { color: theme.colors.textSecondary }]}>
                Editar nombre, dirección y logo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
          </Pressable>

          {/* Admins Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Administradores</Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Añadir administrador"
              >
                <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
              </Pressable>
            </View>

            {usersLoading ? (
              <SkeletonLoader rows={2} variant="list-item" />
            ) : admins.length > 0 ? (
              admins.map((admin: any) => (
                <Pressable
                  key={admin.id}
                  onLongPress={() => confirmDeleteAdmin(admin)}
                  delayLongPress={2000}
                  style={({ pressed }) => [
                    styles.adminCard,
                    { backgroundColor: theme.colors.card, opacity: pressed ? 0.8 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Administrador ${admin.fullName}. Mantén presionado para eliminar.`}
                >
                  <View style={[styles.adminAvatar, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                      {admin.fullName?.charAt(0) ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.adminInfo}>
                    <Text style={[styles.adminName, { color: theme.colors.text }]}>{admin.fullName}</Text>
                    <Text style={[styles.adminEmail, { color: theme.colors.textSecondary }]}>{admin.email}</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                      {admin.role === 'SCHOOL_ADMIN' ? 'Admin' : admin.role}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={[styles.noAdminsText, { color: theme.colors.textSecondary }]}>
                No hay administradores asignados.
              </Text>
            )}
          </View>

          {/* Danger Zone */}
          <View style={[styles.dangerZone, { borderColor: '#FF3B30' + '30' }]}>
            <Text style={[styles.dangerTitle, { color: '#FF3B30' }]}>Zona de Peligro</Text>
            <Pressable
              style={[styles.dangerBtn, { backgroundColor: '#FF3B30' + '10' }]}
              onPress={() => setInstDeleteModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Desactivar institución"
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.dangerBtnText, { color: '#FF3B30' }]}>Eliminar Institución</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Add Admin Modal */}
        <AdminEnrollmentModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          institutionId={id as string}
          onSuccess={handleAdminAdded}
        />

        {/* Delete Admin Confirmation Modal */}
        <BaseModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
          <View style={styles.deleteModalContent}>
            <View style={[styles.deleteIconContainer, { backgroundColor: '#FF3B3015' }]}>
              <Ionicons name="trash" size={32} color="#FF3B30" />
            </View>
            <Text style={[styles.deleteTitle, { color: theme.colors.text }]}>¿Eliminar Administrador?</Text>
            <Text style={[styles.deleteText, { color: theme.colors.textSecondary }]}>
              Estás a punto de eliminar a{' '}
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>
                {selectedAdmin?.fullName}
              </Text>
              . Esta persona perderá todos los accesos administrativos de forma inmediata.
            </Text>
            <View style={styles.deleteActions}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.cancelBtn, { backgroundColor: theme.colors.background }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteAdmin}
                style={[styles.confirmDeleteBtn, { backgroundColor: '#FF3B30' }]}
                disabled={removeAdminMutation.isPending}
              >
                {removeAdminMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </BaseModal>

        {/* Institution Deactivation Modal */}
        <BaseModal visible={instDeleteModalVisible} onClose={() => setInstDeleteModalVisible(false)}>
          <View style={styles.deleteModalContent}>
            <View style={[styles.deleteIconContainer, { backgroundColor: '#FF3B3015' }]}>
              <Ionicons name="business" size={32} color="#FF3B30" />
            </View>
            <Text style={[styles.deleteTitle, { color: theme.colors.text }]}>¿Desactivar Institución?</Text>
            <Text style={[styles.deleteText, { color: theme.colors.textSecondary }]}>
              Esta acción{' '}
              <Text style={{ fontWeight: '700', color: '#FF3B30' }}>desactivará</Text> el acceso a
              todos los usuarios vinculados. Los datos se mantendrán guardados pero la institución
              dejará de estar operativa.
            </Text>
            <View style={styles.deleteActions}>
              <Pressable
                onPress={() => setInstDeleteModalVisible(false)}
                style={[styles.cancelBtn, { backgroundColor: theme.colors.background }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteInstitution}
                style={[styles.confirmDeleteBtn, { backgroundColor: '#FF3B30' }]}
                disabled={deleteInstitutionMutation.isPending}
              >
                {deleteInstitutionMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>Desactivar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </BaseModal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '700' },
  menuSub: { fontSize: 12, marginTop: 2 },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  adminAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 15, fontWeight: '700' },
  adminEmail: { fontSize: 12 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700' },
  noAdminsText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  dangerZone: {
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  dangerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15 },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 15,
    gap: 10,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '700' },
  deleteModalContent: { alignItems: 'center', paddingVertical: 10 },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  deleteText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  deleteActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '700' },
  confirmDeleteBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
