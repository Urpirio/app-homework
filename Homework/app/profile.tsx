import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [logoutVisible, setLogoutVisible] = React.useState(false);

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const handleLogout = () => {
    // Simular logout
    router.replace('/login');
  };

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
              <View style={{ width: 40 }} />
            </View>

            <Animated.View entering={FadeInDown.duration(800)} style={styles.profileSection}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>JD</Text>
                <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success }]} />
              </View>
              <Text style={[styles.userName, { color: theme.colors.text }]}>John Doe</Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>john.doe@example.com</Text>
              <View style={[styles.roleBadge, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.roleText, { color: theme.colors.primary }]}>Project Manager</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
              <StatCard label="Proyectos" value="12" icon="folder-outline" color={theme.colors.primary} />
              <StatCard label="Tareas" value="48" icon="checkbox-outline" color={theme.colors.success} />
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
    marginBottom: 16,
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
});
