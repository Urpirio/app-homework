import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_SUBJECTS = [
  { id: 'm1', name: 'Matemáticas IV', teacher: 'Prof. Alberto Rivera', grade: 9.5, color: '#5856D6', icon: 'calculator' },
  { id: 'm2', name: 'Historia Universal', teacher: 'Prof. Elena Martínez', grade: 8.2, color: '#FF9500', icon: 'book' },
  { id: 'm3', name: 'Física I', teacher: 'Prof. Roberto Sanz', grade: 7.8, color: '#FF2D55', icon: 'flask' },
  { id: 'm4', name: 'Literatura', teacher: 'Prof. Lucía Peña', grade: 10, color: '#34C759', icon: 'library' },
  { id: 'm5', name: 'Inglés III', teacher: 'Prof. Kevin White', grade: 8.8, color: '#007AFF', icon: 'language' },
];

export default function SubjectsScreen() {
  const { theme } = useTheme();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/projects');
      if (response.data && response.data.length > 0) {
        setSubjects(response.data);
      } else {
        setSubjects(MOCK_SUBJECTS);
      }
    } catch (error) {
      setSubjects(MOCK_SUBJECTS);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [])
  );

  const getGradeColor = (grade: number) => {
    if (grade >= 9) return '#34C759';
    if (grade >= 7) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mis Materias</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Ciclo Escolar 2026 - Activo</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 100)}>
                <Pressable 
                  onPress={() => router.push(`/projects/${item.id}`)}
                  style={({ pressed }) => [
                    styles.subjectCard, 
                    { backgroundColor: theme.colors.card, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: (item.color || theme.colors.primary) + '15' }]}>
                    <Ionicons name={(item.icon || 'journal') as any} size={24} color={item.color || theme.colors.primary} />
                  </View>
                  
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.teacherName, { color: theme.colors.textSecondary }]}>{item.teacher || 'Docente Titular'}</Text>
                  </View>

                  <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(item.grade || 0) + '15' }]}>
                    <Text style={[styles.gradeText, { color: getGradeColor(item.grade || 0) }]}>
                      {(item.grade || 0).toFixed(1)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.border} style={{ marginLeft: 10 }} />
                </Pressable>
              </Animated.View>
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 25, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: 25, paddingBottom: 40 },
  subjectCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  iconBox: { 
    width: 52, 
    height: 52, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  teacherName: { fontSize: 13, fontWeight: '600' },
  gradeBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12,
    minWidth: 45,
    alignItems: 'center'
  },
  gradeText: { fontSize: 14, fontWeight: '800' },
});
