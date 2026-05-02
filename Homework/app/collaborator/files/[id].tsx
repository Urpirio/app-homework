import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SharedFilesScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'images' | 'docs'>('images');

  // Datos simulados extensos
  const sharedImages = Array(12).fill(null).map((_, i) => ({ id: `img${i}`, uri: null }));
  const sharedDocs = [
    { id: 'd1', name: 'Especificaciones_Proyecto.pdf', date: 'Hace 2 días', size: '1.2 MB' },
    { id: 'd2', name: 'Guia_Diseno_v2.docx', date: 'Hace 3 días', size: '2.5 MB' },
    { id: 'd3', name: 'Contrato_Colaboracion.pdf', date: 'Hace 1 semana', size: '800 KB' },
    { id: 'd4', name: 'Planificacion_Q2.xlsx', date: 'Hace 2 semanas', size: '1.1 MB' },
    { id: 'd5', name: 'Logo_Variaciones.zip', date: 'Hace 1 mes', size: '15 MB' },
  ];

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
        {activeTab === 'images' ? (
          <FlatList
            key="images-list"
            data={sharedImages}
            numColumns={3}
            keyExtractor={item => item.id}
            renderItem={({ index }) => (
              <Animated.View 
                entering={FadeIn.delay(index * 50)}
                style={[styles.imageItem, { backgroundColor: theme.colors.border }]} 
              />
            )}
            columnWrapperStyle={styles.imageRow}
            showsVerticalScrollIndicator={false}
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
                    <Text style={[styles.docName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.docMeta, { color: theme.colors.textSecondary }]}>{item.date} • {item.size}</Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            )}
            contentContainerStyle={styles.docsList}
            showsVerticalScrollIndicator={false}
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
});
