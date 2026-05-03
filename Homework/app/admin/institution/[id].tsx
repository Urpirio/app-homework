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
  Image,
  FlatList
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EnrollmentOptionsModal } from '@/components/login/EnrollmentOptionsModal';
import { ClassroomOptionsModal } from '@/components/login/ClassroomOptionsModal';
import { ClassroomModal } from '@/components/login/ClassroomModal';
import { ManualEnrollmentModal } from '@/components/login/ManualEnrollmentModal';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InstitutionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [classOptionsVisible, setClassOptionsVisible] = useState(false);
  const [classManualVisible, setClassManualVisible] = useState(false);

  const fetchDetail = async () => {
    try {
      // Intentar fetch real
      const res = await api.get(`/institutions/${id}`);
      setInstitution(res.data);
    } catch (error) {
      // Mock data si falla o para desarrollo
      const mockDetails: Record<string, any> = {
        'i1': { name: 'Universidad Nacional Autónoma', address: 'Av. Universitaria 123', logoUrl: 'https://logo.clearbit.com/unam.mx', stats: { students: 1250, teachers: 85, projects: 45, avgGrade: 8.5 } },
        'i2': { name: 'Instituto Tecnológico de Monterrey', address: 'Calle del Sol 456', logoUrl: 'https://logo.clearbit.com/tec.mx', stats: { students: 850, teachers: 60, projects: 30, avgGrade: 9.2 } },
      };
      setInstitution(mockDetails[id || ''] || { name: 'Institución de Prueba', address: 'Dirección de prueba', stats: { students: 100, teachers: 10, projects: 5, avgGrade: 7.0 } });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primaryLight }]}>
              {institution?.logoUrl ? (
                <Image source={{ uri: institution.logoUrl }} style={styles.logo} />
              ) : (
                <Ionicons name="business" size={40} color={theme.colors.primary} />
              )}
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>{institution?.name}</Text>
            <Text style={[styles.address, { color: theme.colors.textSecondary }]}>{institution?.address}</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard 
              index={0}
              label="Alumnos" 
              value={institution?.stats?.students} 
              icon="people" 
              color="#007AFF" 
              onPress={() => router.push(`/admin/institution/${id}/students`)}
            />
            <StatCard 
              index={1}
              label="Maestros" 
              value={institution?.stats?.teachers} 
              icon="school" 
              color="#5856D6" 
              onPress={() => router.push(`/admin/institution/${id}/teachers`)}
            />
            <StatCard 
              index={2}
              label="Aulas" 
              value={institution?.stats?.projects} 
              icon="book" 
              color="#FF9500" 
              onPress={() => router.push(`/admin/institution/${id}/classrooms`)}
            />
            <StatCard index={3} label="Promedio" value={institution?.stats?.avgGrade} icon="trending-up" color="#34C759" />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Acciones Administrativas</Text>
            <View style={styles.actionRow}>
              <ActionButton 
                icon="person-add" 
                label="Añadir Alumno" 
                onPress={() => setOptionsVisible(true)} 
              />
              <ActionButton 
                icon="add-circle" 
                label="Nueva Aula" 
                onPress={() => setClassOptionsVisible(true)} 
              />
              <ActionButton 
                icon="settings" 
                label="Configurar" 
                onPress={() => router.push(`/admin/institution/${id}/settings`)} 
              />
            </View>
          </View>
        </ScrollView>

        <EnrollmentOptionsModal 
          visible={optionsVisible}
          onClose={() => setOptionsVisible(false)}
          onSelectOption={(option) => {
            setOptionsVisible(false);
            if (option === 'SINGLE') {
              router.push(`/admin/institution/${id}/enroll-student`);
            }
          }}
        />

        <ClassroomOptionsModal 
          visible={classOptionsVisible}
          onClose={() => setClassOptionsVisible(false)}
          onSelectOption={(option) => {
            setClassOptionsVisible(false);
            if (option === 'SINGLE') {
              setClassManualVisible(true);
            }
          }}
        />

        <ClassroomModal
          visible={classManualVisible}
          onClose={() => setClassManualVisible(false)}
          institutionId={id as string}
          onSuccess={fetchDetail}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, icon, color, onPress, index }: any) => {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.statCard, 
          { 
            backgroundColor: theme.colors.card, 
            opacity: pressed && onPress ? 0.8 : 1,
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
      </Pressable>
    </Animated.View>
  );
};

const ActionButton = ({ icon, label, onPress }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable style={styles.actionBtn} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryLight }]}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { alignSelf: 'flex-start', width: 40, height: 40, justifyContent: 'center' },
  logoContainer: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logo: { width: 100, height: 100, borderRadius: 30 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  address: { fontSize: 14, marginTop: 4, opacity: 0.7, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
  statCard: { 
    width: (SCREEN_WIDTH - 30) / 2, 
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
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600' },
});
