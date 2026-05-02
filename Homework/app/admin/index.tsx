import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import api from '@/utils/api';
import { UserRole } from '@/types/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const profileRes = await api.get('/auth/profile');
      setUser(profileRes.data);
      
      if (profileRes.data.institutionId) {
        const statsRes = await api.get(`/institutions/${profileRes.data.institutionId}/stats`);
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

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

            {/* Stats Overview */}
            <View style={styles.statsGrid}>
              <StatItem 
                label="Estudiantes" 
                value={stats?.students || 0} 
                icon="people" 
                color="#007AFF" 
              />
              <StatItem 
                label="Maestros" 
                value={stats?.teachers || 0} 
                icon="school" 
                color="#5856D6" 
              />
              <StatItem 
                label="Aulas" 
                value={stats?.classrooms || 0} 
                icon="business" 
                color="#FF9500" 
              />
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Acciones Rápidas</Text>
              
              <AdminAction 
                title="Nueva Aula" 
                subtitle="Crear un salón y asignar maestro"
                icon="add-circle"
                color={theme.colors.primary}
                onPress={() => {}}
              />
              
              <AdminAction 
                title="Registrar Estudiante" 
                subtitle="Crear cuenta para un alumno"
                icon="person-add"
                color={theme.colors.success}
                onPress={() => {}}
              />
              
              <AdminAction 
                title="Contratar Maestro" 
                subtitle="Añadir personal docente"
                icon="briefcase"
                color="#5856D6"
                onPress={() => {}}
              />
              
              <AdminAction 
                title="Personal de Soporte" 
                subtitle="Asignar técnicos de apoyo"
                icon="construct"
                color="#FF9500"
                onPress={() => {}}
              />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const StatItem = ({ label, value, icon, color }: any) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.statItem, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
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
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statItem: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
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
