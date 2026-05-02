import React from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollaboratorProfile() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  // Datos simulados de proyectos en común
  const commonProjects = [
    { id: 'p1', title: 'Diseño de App Homework', status: 'En curso', color: '#6366f1' },
    { id: 'p2', title: 'Sistema de Notificaciones', status: 'Finalizado', color: '#10b981' },
    { id: 'p3', title: 'Optimización de Backend', status: 'En curso', color: '#f59e0b' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundShapes />
      
      {/* Header / Back Button */}
      <View style={styles.headerNav}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: theme.colors.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Perfil</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.headerActionBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <Animated.View 
          entering={FadeInUp.duration(600)}
          style={[styles.profileCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={[styles.avatarLarge, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.avatarTextLarge, { color: theme.colors.primary }]}>
              {name?.charAt(0)}
            </Text>
          </View>
          <Text style={[styles.nameText, { color: theme.colors.text }]}>{name}</Text>
          <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>Colaborador</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>12</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tareas</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{commonProjects.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Proyectos</Text>
            </View>
          </View>
        </Animated.View>

        {/* Common Projects Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Proyectos en común</Text>
          <View style={styles.projectsList}>
            {commonProjects.map((project, index) => (
              <Animated.View 
                key={project.id}
                entering={FadeInDown.delay(index * 150).duration(500)}
                style={[styles.projectCard, { backgroundColor: theme.colors.card }]}
              >
                <View style={[styles.projectIndicator, { backgroundColor: project.color }]} />
                <View style={styles.projectContent}>
                  <Text style={[styles.projectTitle, { color: theme.colors.text }]}>{project.title}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: project.color }]} />
                    <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>{project.status}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.viewProjectBtn}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Shared Files Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Archivos compartidos</Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/collaborator/files/[id]',
                params: { id, name }
              })}
            >
              <Text style={[styles.seeMoreBtn, { color: theme.colors.primary }]}>Ver más</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.sharedFilesContent}>
            {/* Images Grid Snippet */}
            <View style={styles.imagesRow}>
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.border }]} />
            </View>
            
            {/* Documents List */}
            <View style={styles.docItemsList}>
              <TouchableOpacity style={[styles.docItem, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                <Text style={[styles.docItemText, { color: theme.colors.text }]} numberOfLines={1}>Especificaciones_Proyecto.pdf</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.docItem, { backgroundColor: theme.colors.card, marginTop: 8 }]}>
                <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                <Text style={[styles.docItemText, { color: theme.colors.text }]} numberOfLines={1}>Guia_Diseno_v2.docx</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 30,
    marginBottom: 30,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTextLarge: {
    fontSize: 40,
    fontWeight: '800',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingRight: 4,
  },
  seeMoreBtn: {
    fontSize: 14,
    fontWeight: '700',
  },
  projectsList: {
    gap: 16,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  projectIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  projectContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sharedFilesContent: {
    gap: 16,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imagePlaceholder: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
  },
  docItemsList: {
    marginTop: 4,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  docItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
