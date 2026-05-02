import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import * as SecureStore from 'expo-secure-store';
import api from '@/utils/api';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { Modal } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: 'success',
      text1: 'Copiado',
      text2: 'Código de identidad copiado al portapapeles',
      position: 'top'
    });
  };

  const fetchProfile = async () => {
    if (!user) setLoading(true);
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: theme.colors.text }]}>Perfil</Text>
              <Pressable onPress={() => setQrVisible(true)} style={styles.qrHeaderButton}>
                <Ionicons name="qr-code-outline" size={24} color={theme.colors.primary} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <Animated.View entering={FadeInDown.duration(800)} style={styles.profileSection}>
                <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </Text>
                  )}
                  <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success }]} />
                </View>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {user?.fullName || 'Usuario'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                  {user?.email || 'email@example.com'}
                </Text>
                
                {user?.identityCode && (
                  <Pressable 
                    onPress={() => copyToClipboard(user.identityCode)}
                    style={[styles.idContainer, { backgroundColor: theme.colors.card }]}
                  >
                    <Text style={[styles.idLabel, { color: theme.colors.textSecondary }]}>ID:</Text>
                    <Text style={[styles.idText, { color: theme.colors.text }]}>{user.identityCode}</Text>
                    <Ionicons name="copy-outline" size={14} color={theme.colors.primary} style={{ marginLeft: 6 }} />
                  </Pressable>
                )}

                <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                    {user?.role || 'Miembro'}
                  </Text>
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
              <StatCard 
                label="Proyectos" 
                value={user?.stats?.projects?.toString() || '0'} 
                icon="folder-outline" 
                color={theme.colors.primary} 
              />
              <StatCard 
                label="Tareas" 
                value={user?.stats?.tasks?.toString() || '0'} 
                icon="checkbox-outline" 
                color={theme.colors.success} 
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={styles.optionsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Configuración</Text>
              
              <ProfileOption 
                icon="person-outline" 
                label="Editar Perfil" 
                onPress={() => router.push('/edit-profile')}
              />
              <ProfileOption 
                icon="notifications-outline" 
                label="Notificaciones" 
                onPress={() => router.push('/notifications')}
              />
              <ProfileOption 
                icon="lock-closed-outline" 
                label="Seguridad" 
                onPress={() => router.push('/security')}
              />
              <ProfileOption 
                icon="color-palette-outline" 
                label="Apariencia" 
                onPress={() => router.push('/appearance')}
              />
              <ProfileOption 
                icon="help-circle-outline" 
                label="Ayuda y Soporte" 
                onPress={() => router.push('/support')}
              />
              
              <View style={[styles.logoutContainer, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                <Pressable 
                  onPress={() => setLogoutVisible(true)}
                  style={styles.logoutButton}
                >
                  <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                  <Text style={[styles.logoutText, { color: theme.colors.error }]}>Cerrar Sesión</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        <ConfirmModal 
          visible={logoutVisible}
          onClose={() => setLogoutVisible(false)}
          onConfirm={handleLogout}
          title="Cerrar Sesión"
          message="¿Estás seguro de que deseas salir de tu cuenta?"
          confirmLabel="Salir"
          isDestructive={true}
        />

        {/* QR Identification Modal */}
        <Modal
          visible={qrVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setQrVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setQrVisible(false)}
          >
            <Animated.View 
              entering={FadeInDown}
              style={[styles.qrModalContent, { backgroundColor: theme.colors.card }]}
            >
              <View style={styles.qrHeader}>
                <Text style={[styles.qrTitle, { color: theme.colors.text }]}>Identificación QR</Text>
                <Pressable onPress={() => setQrVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
              </View>
              
              <View style={styles.qrCodeContainer}>
                {user?.identityCode && (
                  <QRCode
                    value={user.identityCode}
                    size={200}
                    color={theme.colors.text}
                    backgroundColor="transparent"
                  />
                )}
              </View>
              
              <Text style={[styles.qrName, { color: theme.colors.text }]}>{user?.fullName}</Text>
              <Text style={[styles.qrSubtitle, { color: theme.colors.textSecondary }]}>
                Comparte este código para que te agreguen como colaborador
              </Text>
              
              <View style={[styles.qrIdBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.qrIdText, { color: theme.colors.primary }]}>{user?.identityCode}</Text>
              </View>
            </Animated.View>
          </Pressable>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, icon, color }: any) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const ProfileOption = ({ icon, label, onPress }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={styles.optionItem}
    >
      <View style={[styles.optionIcon, { backgroundColor: theme.colors.card }]}>
        <Ionicons name={icon} size={20} color={theme.colors.text} />
      </View>
      <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  editButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  title: { fontSize: 24, fontWeight: '800' },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: { fontSize: 36, fontWeight: '800' },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  optionsSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  logoutContainer: {
    marginTop: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  qrHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  idLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  idText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
  },
  qrName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  qrIdBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  qrIdText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
