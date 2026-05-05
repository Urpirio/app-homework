import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { queryClient } from '@/utils/queryClient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const API_URL = 'https://app-homework-production.up.railway.app';
const getFullUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  SCHOOL_ADMIN: 'Administrador',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
  SUPPORT: 'Soporte',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#FF3B30',
  SCHOOL_ADMIN: '#FF9500',
  TEACHER: '#007AFF',
  STUDENT: '#34C759',
  SUPPORT: '#AF52DE',
};

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const { data: user, isLoading: loading } = useProfile();

  const handleLogout = async () => {
    try {
      // 1. Clear secure storage
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('refreshToken');
      
      // 2. Clear React Query cache completely
      // This is crucial to prevent the next user from seeing previous data
      queryClient.clear();
      
      // 3. Redirect to login
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback redirect
      router.replace('/login');
    }
  };

  const copyCode = async () => {
    if (!user?.identityCode) return;
    await Clipboard.setStringAsync(user.identityCode);
    Toast.show({ type: 'success', text1: 'Copiado', text2: 'Código copiado al portapapeles' });
  };

  const roleColor = ROLE_COLORS[user?.role] ?? theme.colors.primary;
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? 'Miembro';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mi Perfil</Text>
            <Pressable onPress={() => setQrVisible(true)} style={styles.iconBtn}>
              <Ionicons name="qr-code-outline" size={24} color={theme.colors.primary} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
          ) : (
            <>
              {/* ── Hero card ── */}
              <Animated.View entering={FadeInDown.duration(500)}>
                <View style={[styles.heroCard, { backgroundColor: theme.colors.card }]}>
                  {/* Avatar */}
                  <View style={styles.avatarWrapper}>
                    <View style={[styles.avatarRing, { borderColor: roleColor }]}>
                      {user?.avatarUrl ? (
                        <Image source={{ uri: getFullUrl(user.avatarUrl) }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: roleColor + '20' }]}>
                          <Text style={[styles.avatarInitial, { color: roleColor }]}>
                            {user?.fullName?.charAt(0) ?? 'U'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.onlineDot, { backgroundColor: theme.colors.success ?? '#34C759', borderColor: theme.colors.card }]} />
                  </View>

                  {/* Name & role */}
                  <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.fullName}</Text>
                  <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user?.email}</Text>

                  <View style={[styles.rolePill, { backgroundColor: roleColor + '18' }]}>
                    <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
                    <Text style={[styles.roleLabel, { color: roleColor }]}>{roleLabel}</Text>
                  </View>

                  {/* Identity code */}
                  {user?.identityCode && (
                    <Pressable onPress={copyCode} style={[styles.idRow, { backgroundColor: theme.colors.background }]}>
                      <Ionicons name="finger-print-outline" size={16} color={theme.colors.primary} />
                      <Text style={[styles.idCode, { color: theme.colors.text }]}>{user.identityCode}</Text>
                      <Ionicons name="copy-outline" size={14} color={theme.colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </Animated.View>

              {/* ── Info cards ── */}
              <Animated.View entering={FadeInDown.delay(150)} style={styles.infoGrid}>
                {user?.bio && (
                  <InfoChip icon="document-text-outline" label="Sobre mí" value={user.bio} theme={theme} fullWidth />
                )}
                {user?.specialty && (
                  <InfoChip icon="school-outline" label="Especialidad" value={user.specialty} theme={theme} />
                )}
                {user?.classroom?.name && (
                  <InfoChip icon="people-outline" label="Aula" value={user.classroom.name} theme={theme} />
                )}
                {user?.parentName && (
                  <InfoChip icon="person-outline" label="Tutor" value={user.parentName} theme={theme} />
                )}
                {user?.parentPhone && (
                  <InfoChip icon="call-outline" label="Tel. Tutor" value={user.parentPhone} theme={theme} />
                )}
              </Animated.View>

              {/* ── Stats ── */}
              <Animated.View entering={FadeInRight.delay(200)} style={styles.statsRow}>
                <StatCard icon="journal-outline" label="Materias" value={user?.stats?.projects ?? '—'} color={theme.colors.primary} theme={theme} />
                <StatCard icon="time-outline" label="Pendientes" value={user?.stats?.pendingTasks ?? '—'} color="#FF9500" theme={theme} />
                <StatCard icon="checkmark-circle-outline" label="Entregadas" value={user?.stats?.completedTasks ?? '—'} color="#34C759" theme={theme} />
              </Animated.View>

              {/* ── Options ── */}
              <Animated.View entering={FadeInDown.delay(300)} style={[styles.optionsCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>CUENTA</Text>
                <Option icon="create-outline" label="Editar Perfil" color={theme.colors.primary} onPress={() => router.push('/edit-profile')} theme={theme} />
                <Option icon="lock-closed-outline" label="Seguridad" color="#FF9500" onPress={() => router.push('/security')} theme={theme} />
                <Option icon="notifications-outline" label="Notificaciones" color="#AF52DE" onPress={() => router.push('/notifications')} theme={theme} />
                <Option icon="color-palette-outline" label="Apariencia" color="#00C7BE" onPress={() => router.push('/appearance')} theme={theme} />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(350)} style={[styles.optionsCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>SOPORTE</Text>
                <Option icon="help-circle-outline" label="Ayuda y Soporte" color="#34C759" onPress={() => router.push('/support')} theme={theme} />
              </Animated.View>

              {/* ── Logout ── */}
              <Animated.View entering={FadeInDown.delay(400)}>
                <Pressable
                  onPress={() => setLogoutVisible(true)}
                  style={[styles.logoutBtn, { backgroundColor: '#FF3B3015' }]}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                  <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </Pressable>
              </Animated.View>

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>

        {/* ── Modals ── */}
        <ConfirmModal
          visible={logoutVisible}
          onClose={() => setLogoutVisible(false)}
          onConfirm={handleLogout}
          title="Cerrar Sesión"
          message="¿Estás seguro de que deseas salir de tu cuenta?"
          confirmLabel="Salir"
          isDestructive
        />

        <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setQrVisible(false)}>
            <Animated.View entering={FadeInDown} style={[styles.qrCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.qrCardHeader}>
                <Text style={[styles.qrTitle, { color: theme.colors.text }]}>Identificación QR</Text>
                <Pressable onPress={() => setQrVisible(false)}>
                  <Ionicons name="close-circle" size={26} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.qrBox}>
                {user?.identityCode && (
                  <QRCode value={user.identityCode} size={180} color={theme.colors.text} backgroundColor="transparent" />
                )}
              </View>
              <Text style={[styles.qrName, { color: theme.colors.text }]}>{user?.fullName}</Text>
              <Text style={[styles.qrHint, { color: theme.colors.textSecondary }]}>
                Comparte este código para que te agreguen como contacto
              </Text>
              <Pressable onPress={copyCode} style={[styles.qrCodePill, { backgroundColor: roleColor + '18' }]}>
                <Text style={[styles.qrCodeText, { color: roleColor }]}>{user?.identityCode}</Text>
                <Ionicons name="copy-outline" size={14} color={roleColor} style={{ marginLeft: 6 }} />
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const InfoChip = ({ icon, label, value, theme, fullWidth }: any) => (
  <View style={[styles.infoChip, { backgroundColor: theme.colors.card }, fullWidth && { width: '100%' }]}>
    <Ionicons name={icon} size={16} color={theme.colors.primary} style={{ marginBottom: 4 }} />
    <Text style={[styles.infoChipLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.infoChipValue, { color: theme.colors.text }]} numberOfLines={3}>{value}</Text>
  </View>
);

const StatCard = ({ icon, label, value, color, theme }: any) => (
  <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
  </View>
);

const Option = ({ icon, label, color, onPress, theme }: any) => (
  <Pressable onPress={onPress} style={styles.optionRow}>
    <View style={[styles.optionIconBox, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.border} />
  </Pressable>
);

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },

  heroCard: { borderRadius: 28, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 38, fontWeight: '900' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, borderWidth: 3 },
  userName: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  userEmail: { fontSize: 13, fontWeight: '500', marginBottom: 12 },
  rolePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 14, gap: 6 },
  roleDot: { width: 7, height: 7, borderRadius: 4 },
  roleLabel: { fontSize: 13, fontWeight: '800' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: 12 },
  idCode: { flex: 1, fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  bio: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  infoChip: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 18 },
  infoChipLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  infoChipValue: { fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600' },

  optionsCard: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingVertical: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 14 },
  optionIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '600' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 18, marginTop: 4 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrCard: { width: '100%', maxWidth: 340, borderRadius: 30, padding: 24, alignItems: 'center' },
  qrCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  qrTitle: { fontSize: 18, fontWeight: '800' },
  qrBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 20 },
  qrName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  qrHint: { fontSize: 12, textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
  qrCodePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  qrCodeText: { fontSize: 15, fontWeight: '800', letterSpacing: 2 },
});
