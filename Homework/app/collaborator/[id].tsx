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

  const [commonProjects, setCommonProjects] = useState<any[]>([]);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [collaboratorStats, setCollaboratorStats] = useState({ projects: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [projectsRes, filesRes, profileRes] = await Promise.all([
        api.get(`/collaborators/${id}/common-projects`),
        api.get(`/messages/${id}/files`),
        api.get(`/collaborators/${id}/profile`),
      ]);
      
      const allProjects = [
        ...(projectsRes.data.userProjects || []).map((p: any) => ({ ...p, status: 'En curso' })),
        ...(projectsRes.data.collabProjects || []).map((p: any) => ({ ...p, status: 'En curso' })),
      ];
      setCommonProjects(allProjects);
      setSharedFiles(filesRes.data || []);
      if (profileRes.data.stats) {
        setCollaboratorStats(profileRes.data.stats);
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
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{collaboratorStats.tasks}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Tareas</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{collaboratorStats.projects}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Proyectos</Text>
            </View>
          </View>
        </Animated.View>

        {/* Common Projects Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Proyectos en común</Text>
          <View style={styles.projectsList}>
            {commonProjects.length > 0 ? (
              commonProjects.map((project, index) => (
                <Animated.View 
                  key={project.id}
                  entering={FadeInDown.delay(index * 150).duration(500)}
                >
                  <TouchableOpacity 
                    style={[styles.projectCard, { backgroundColor: theme.colors.card }]}
                    onPress={() => router.push(`/projects/${project.id}`)}
                  >
                    <View style={[styles.projectIndicator, { backgroundColor: project.color }]} />
                    <View style={styles.projectContent}>
                      <Text style={[styles.projectTitle, { color: theme.colors.text }]}>{project.name}</Text>
                      <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: project.color }]} />
                        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>{project.status}</Text>
                      </View>
                    </View>
                    <View style={styles.viewProjectBtn}>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Aún no tienen proyectos asignados en común.
              </Text>
            )}
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
            {sharedFiles.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.filesScrollContainer}
              >
                {sharedFiles.slice(0, 5).map((file: any, index: number) => (
                  <TouchableOpacity 
                    key={file.id || index} 
                    style={[styles.fileCardDetailed, { backgroundColor: theme.colors.card }]}
                    onPress={() => router.push({
                      pathname: '/collaborator/files/[id]',
                      params: { id, name }
                    })}
                  >
                    <View style={styles.fileCardPreview}>
                      {file.mimeType?.startsWith('image/') ? (
                        <Image source={{ uri: getFullUrl(file.fileUrl) }} style={styles.fileCardImage} />
                      ) : (
                        <View style={[styles.fileCardIconBox, { backgroundColor: theme.colors.primary + '10' }]}>
                          <Ionicons 
                            name={file.mimeType?.includes('pdf') ? "document-text" : "file-tray-full"} 
                            size={32} 
                            color={theme.colors.primary} 
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.fileCardInfo}>
                      <Text style={[styles.fileCardName, { color: theme.colors.text }]} numberOfLines={1}>
                        {file.fileName || 'Archivo'}
                      </Text>
                      <Text style={[styles.fileCardType, { color: theme.colors.textSecondary }]}>
                        {file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {sharedFiles.length > 5 && (
                  <TouchableOpacity 
                    style={[styles.seeAllFilesCard, { backgroundColor: theme.colors.primaryLight }]}
                    onPress={() => router.push({
                      pathname: '/collaborator/files/[id]',
                      params: { id, name }
                    })}
                  >
                    <Ionicons name="arrow-forward-circle" size={32} color={theme.colors.primary} />
                    <Text style={[styles.seeAllFilesText, { color: theme.colors.primary }]}>Ver todos</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              <View style={[styles.emptyFilesBox, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="folder-open-outline" size={24} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyFilesText, { color: theme.colors.textSecondary }]}>Sin archivos compartidos</Text>
              </View>
            )}
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
  filesScrollContainer: {
    paddingRight: 20,
    gap: 16,
  },
  fileCardDetailed: {
    width: 150,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fileCardPreview: {
    width: '100%',
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fileCardImage: {
    width: '100%',
    height: '100%',
  },
  fileCardIconBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileCardInfo: {
    paddingHorizontal: 2,
  },
  fileCardName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  fileCardType: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  seeAllFilesCard: {
    width: 120,
    height: 156,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  seeAllFilesText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyFilesBox: {
    width: '100%',
    padding: 30,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyFilesText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
