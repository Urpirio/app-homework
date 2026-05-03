import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '@/utils/api';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollaboratorProfile() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const API_URL = 'https://app-homework-production.up.railway.app';

  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const [commonSubjects, setCommonSubjects] = useState<any[]>([]);
  const [collaborator, setCollaborator] = useState<any>(null);
  const [academicStats, setAcademicStats] = useState({ subjects: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Simulación de datos educativos si es un perfil de prueba
      if (id?.startsWith('u')) {
        setCollaborator({ fullName: name, role: 'Estudiante', institution: 'Instituto Nacional' });
        setAcademicStats({ subjects: 6, tasks: 42 });
        setCommonSubjects([{ id: 'm1', name: 'Matemáticas IV', color: '#5856D6' }]);
        setLoading(false);
        return;
      }

      const [projectsRes, profileRes] = await Promise.all([
        api.get(`/collaborators/${id}/common-projects`),
        api.get(`/collaborators/${id}/profile`),
      ]);
      
      setCommonSubjects(projectsRes.data.userProjects || []);
      setCollaborator(profileRes.data);
      if (profileRes.data.stats) {
        setAcademicStats({
          subjects: profileRes.data.stats.projects || 0,
          tasks: profileRes.data.stats.tasks || 0
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [id])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundShapes />
      
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Perfil Académico</Text>
        <TouchableOpacity onPress={() => router.push(`/chat/${id}?name=${name}&type=user`)} style={[styles.headerActionBtn, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(600)} style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.avatarLarge, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.avatarTextLarge, { color: theme.colors.primary }]}>{name?.charAt(0)}</Text>
          </View>
          <Text style={[styles.nameText, { color: theme.colors.text }]}>{name}</Text>
          <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>{collaborator?.role || 'Estudiante'}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{academicStats.subjects}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Materias</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{academicStats.tasks}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tareas</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Materias en común</Text>
          <View style={styles.projectsList}>
            {commonSubjects.length > 0 ? (
              commonSubjects.map((subject, index) => (
                <Animated.View key={subject.id} entering={FadeInDown.delay(index * 150)}>
                  <TouchableOpacity style={[styles.projectCard, { backgroundColor: theme.colors.card }]} onPress={() => router.push(`/projects/${subject.id}`)}>
                    <View style={[styles.projectIndicator, { backgroundColor: subject.color || theme.colors.primary }]} />
                    <Text style={[styles.projectTitle, { color: theme.colors.text }]}>{subject.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No comparten materias actualmente.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerActionBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileCard: { alignItems: 'center', padding: 30, borderRadius: 30, marginBottom: 30 },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  avatarTextLarge: { fontSize: 40, fontWeight: '800' },
  nameText: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  roleText: { fontSize: 14, marginBottom: 24 },
  statsContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: 30 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, marginLeft: 4 },
  projectsList: { gap: 12 },
  projectCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20 },
  projectIndicator: { width: 4, height: 30, borderRadius: 2, marginRight: 16 },
  projectTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
});
