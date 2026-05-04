import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ClassroomModal } from '@/components/login/ClassroomModal';
import { UserRegistrationModal } from '@/components/login/UserRegistrationModal';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { UserRole } from '@/types/auth';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { institutionId: contextInstitutionId, setInstitutionId } = useInstitution();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regModalVisible, setRegModalVisible] = useState(false);
  const [classroomModalVisible, setClassroomModalVisible] = useState(false);
  const [regRole, setRegRole] = useState<'STUDENT' | 'TEACHER' | 'SUPPORT'>('STUDENT');

  const fetchAdminData = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      setUser(profileRes.data);
      
      // SCHOOL_ADMIN: fix institutionId from profile (no selector shown)
      if (
        profileRes.data.role === UserRole.SCHOOL_ADMIN &&
        profileRes.data.institutionId
      ) {
        setInstitutionId(profileRes.data.institutionId);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats whenever the contextInstitutionId changes
  useEffect(() => {
    if (!contextInstitutionId) return;

    let cancelled = false;

    async function fetchStats() {
      try {
        const statsRes = await api.get(
          `/institutions/${contextInstitutionId}/stats`
        );
        if (!cancelled) {
          setStats(statsRes.data);
        }
      } catch (error) {
        console.error('Error fetching institution stats:', error);
      }
    }

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [contextInstitutionId]);

  useFocusEffect(
    useCallback(() => {
      fetchAdminData();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isSchoolAdmin = user?.role === UserRole.SCHOOL_ADMIN || user?.role === UserRole.SUPER_ADMIN;

  if (!isSchoolAdmin) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="lock-closed" size={64} color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Acceso Restringido</Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
          Solo el personal administrativo tiene acceso a esta sección.
        </Text>
        <Pressable 
          style={[styles.backBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.backBtnText}>Volver al Inicio</Text>
        </Pressable>
      </View>
    );
  }

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Administración</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {user?.institution?.name || 'Gestión Institucional'}
              </Text>
            </View>

            {/* Institution selector — only shown for SUPER_ADMIN */}
            {user?.role === UserRole.SUPER_ADMIN && (
              <InstitutionSelector />
            )}

            {/* Stats Overview */}
            <View style={styles.statsGrid}>
              <StatItem 
                index={0}
                label="Estudiantes" 
                value={stats?.students || 0} 
                icon="people" 
                color="#007AFF" 
              />
              <StatItem 
                index={1}
                label="Maestros" 
                value={stats?.teachers || 0} 
                icon="school" 
                color="#5856D6" 
              />
              <StatItem 
                index={2}
                label="Aulas" 
                value={stats?.classrooms || 0} 
                icon="business" 
                color="#FF9500" 
              />
              <StatItem 
                index={3}
                label="Promedio" 
                value={(stats?.avgGrade || 0).toFixed(1)} 
                icon="trending-up" 
                color={theme.colors.success} 
              />
            </View>

            <View style={styles.section}>
              <AdminAction 
                title="Directorio de Usuarios" 
                subtitle="Ver alumnos, maestros y soporte"
                icon="people"
                color={theme.colors.primary}
                onPress={() => router.push('/admin/users')}
              />
              <AdminAction 
                title="Analíticas" 
                subtitle="Métricas, gráficas e indicadores"
                icon="analytics"
                color="#5856D6"
                onPress={() => router.push('/admin/analytics')}
              />
            </View>

            {user?.role === UserRole.SUPER_ADMIN && (
              <View style={[styles.section, { marginTop: 30 }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Super Admin Tools</Text>
                
                <AdminAction 
                  title="Listado de Instituciones" 
                  subtitle="Gestionar todas las escuelas"
                  icon="business"
                  color="#FF2D55"
                  onPress={() => router.push('/admin/institutions')}
                />
              </View>
            )}

            <UserRegistrationModal
              visible={regModalVisible}
              onClose={() => setRegModalVisible(false)}
              role={regRole}
              onSuccess={fetchAdminData}
            />

            <ClassroomModal
              visible={classroomModalVisible}
              onClose={() => setClassroomModalVisible(false)}
              institutionId={user?.institutionId}
              onSuccess={fetchAdminData}
            />
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const StatItem = ({ label, value, icon, color, index }: any) => {
  const { theme } = useTheme();
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      style={[
        styles.statItem, 
        { 
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border + '50',
        }
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      </View>
    </Animated.View>
  );
};

const AdminAction = ({ title, subtitle, icon, color, onPress }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard, 
        { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { paddingVertical: 20, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statItem: { 
    width: (SCREEN_WIDTH - 44) / 2, 
    padding: 16, 
    borderRadius: 28, 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12
  },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statContent: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 12 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 17, fontWeight: '700' },
  actionSubtitle: { fontSize: 13, marginTop: 2 },
  errorTitle: { fontSize: 24, fontWeight: '800', marginTop: 20 },
  errorSubtitle: { fontSize: 16, textAlign: 'center', marginTop: 10, opacity: 0.8 },
  backBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
