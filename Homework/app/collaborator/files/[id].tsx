import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import api from '@/utils/api';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SharedFilesScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'images' | 'docs'>('images');
  const [sharedImages, setSharedImages] = useState<any[]>([]);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const [imagesRes, docsRes] = await Promise.all([
        api.get(`/messages/${id}/files?type=image`),
        api.get(`/messages/${id}/files?type=document`),
      ]);
      setSharedImages(imagesRes.data || []);
      setSharedDocs(docsRes.data || []);
    } catch (error) {
      console.error('Error fetching shared files:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFiles();
    }, [id])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <BackgroundShapes />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Archivos compartidos</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>con {name}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'images' && { borderBottomColor: theme.colors.primary }]} 
          onPress={() => setActiveTab('images')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'images' ? theme.colors.primary : theme.colors.textSecondary }]}>Imágenes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'docs' && { borderBottomColor: theme.colors.primary }]} 
          onPress={() => setActiveTab('docs')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'docs' ? theme.colors.primary : theme.colors.textSecondary }]}>Documentos</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'images' ? (
          <FlatList
            key="images-list"
            data={sharedImages}
            numColumns={3}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <Animated.View 
                entering={FadeIn.delay(index * 50)}
                style={[styles.imageItem, { backgroundColor: theme.colors.border }]} 
              >
                {item.fileUrl && <Image source={{ uri: item.fileUrl }} style={styles.imageItem} />}
              </Animated.View>
            )}
            columnWrapperStyle={styles.imageRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No hay imágenes compartidas</Text>
            }
          />
        ) : (
          <FlatList
            key="docs-list"
            data={sharedDocs}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.delay(index * 50)}>
                <TouchableOpacity style={[styles.docItem, { backgroundColor: theme.colors.card }]}>
                  <View style={[styles.docIcon, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name="document-text" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={[styles.docName, { color: theme.colors.text }]} numberOfLines={1}>{item.fileName}</Text>
                    <Text style={[styles.docMeta, { color: theme.colors.textSecondary }]}>
                      {new Date(item.createdAt).toLocaleDateString()}
                      {item.fileSize ? ` \u2022 ${(item.fileSize / 1024).toFixed(0)} KB` : ''}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            )}
            contentContainerStyle={styles.docsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No hay documentos compartidos</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 12,
  },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13 },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 15, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20 },
  imageRow: { justifyContent: 'flex-start', gap: 10, marginBottom: 10 },
  imageItem: {
    width: (SCREEN_WIDTH - 60) / 3,
    aspectRatio: 1,
    borderRadius: 12,
  },
  docsList: { gap: 12, paddingBottom: 20 },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  docMeta: { fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
