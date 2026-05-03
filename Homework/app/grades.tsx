import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACADEMIC_PERIODS = ['1er Trimestre', '2do Trimestre', '3er Trimestre', 'Final'];

const MOCK_GRADES = {
  '1er Trimestre': [
    { id: '1', subject: 'Matemáticas IV', grade: 9.5, letter: 'A', teacher: 'Alberto Rivera' },
    { id: '2', subject: 'Historia Universal', grade: 8.0, letter: 'B', teacher: 'Elena Martínez' },
    { id: '3', subject: 'Física I', grade: 10, letter: 'A+', teacher: 'Roberto Sanz' },
    { id: '4', subject: 'Literatura', grade: 7.5, letter: 'C', teacher: 'Lucía Peña' },
  ],
  '2do Trimestre': [
    { id: '1', subject: 'Matemáticas IV', grade: 9.0, letter: 'A', teacher: 'Alberto Rivera' },
    { id: '2', subject: 'Historia Universal', grade: 8.5, letter: 'B+', teacher: 'Elena Martínez' },
  ]
};

export default function GradesScreen() {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('1er Trimestre');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const currentGrades = user?.subjects || [];
  const gpa = user?.stats?.avgGrade?.toFixed(1) || '0.0';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calificaciones</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Resumen de Promedio */}
          <Animated.View entering={FadeInUp.duration(600)} style={[styles.gpaCard, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.gpaInfo}>
              <Text style={styles.gpaLabel}>Promedio General</Text>
              <Text style={styles.gpaValue}>{gpa}</Text>
              <Text style={styles.gpaStatus}>Excelente Desempeño</Text>
            </View>
            <View style={styles.gpaBadge}>
              <Ionicons name="school" size={40} color="rgba(255,255,255,0.3)" />
            </View>
          </Animated.View>

          {/* Selector de Periodo */}
          <View style={styles.periodSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodList}>
              {ACADEMIC_PERIODS.map((period) => (
                <Pressable 
                  key={period} 
                  onPress={() => setSelectedPeriod(period)}
                  style={[
                    styles.periodItem, 
                    { backgroundColor: selectedPeriod === period ? theme.colors.primaryLight : theme.colors.card }
                  ]}
                >
                  <Text style={[styles.periodText, { color: selectedPeriod === period ? theme.colors.primary : theme.colors.textSecondary }]}>
                    {period}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Lista de Calificaciones */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Detalle por Materia</Text>
            {currentGrades.length > 0 ? currentGrades.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 100)} style={[styles.gradeCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.gradeInfo}>
                  <Text style={[styles.subjectName, { color: theme.colors.text }]}>{item.subject}</Text>
                  <Text style={[styles.teacherName, { color: theme.colors.textSecondary }]}>{item.teacher}</Text>
                </View>
                <View style={styles.gradeValueContainer}>
                  <Text style={[styles.gradeNum, { color: theme.colors.text }]}>{item.grade}</Text>
                  <View style={[styles.letterBadge, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={[styles.letterText, { color: theme.colors.primary }]}>{item.letter}</Text>
                  </View>
                </View>
              </Animated.View>
            )) : (
              <View style={[styles.emptyBox, { backgroundColor: theme.colors.card }]}>
                <Text style={{ color: theme.colors.textSecondary }}>Aún no hay calificaciones registradas para este periodo.</Text>
              </View>
            )}
          </View>

          {/* Sección de Boleta PDF */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Documentos Oficiales</Text>
            <Pressable style={[styles.pdfCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.pdfIcon, { backgroundColor: '#FF3B3015' }]}>
                <Ionicons name="document-text" size={24} color="#FF3B30" />
              </View>
              <View style={styles.pdfInfo}>
                <Text style={[styles.pdfTitle, { color: theme.colors.text }]}>Boleta de Calificaciones - {selectedPeriod}</Text>
                <Text style={[styles.pdfMeta, { color: theme.colors.textSecondary }]}>PDF • 1.2 MB • Actualizado hoy</Text>
              </View>
              <Ionicons name="download-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20 },
  gpaCard: { borderRadius: 30, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  gpaInfo: { flex: 1 },
  gpaLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  gpaValue: { color: '#FFF', fontSize: 42, fontWeight: '900', marginBottom: 4 },
  gpaStatus: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', opacity: 0.9 },
  gpaBadge: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  periodSelector: { marginBottom: 25 },
  periodList: { gap: 10 },
  periodItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15 },
  periodText: { fontSize: 13, fontWeight: '700' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, marginLeft: 5 },
  gradeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 24, marginBottom: 10 },
  gradeInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  teacherName: { fontSize: 12, fontWeight: '500' },
  gradeValueContainer: { alignItems: 'flex-end', gap: 4 },
  gradeNum: { fontSize: 20, fontWeight: '900' },
  letterBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  letterText: { fontSize: 12, fontWeight: '800' },
  pdfCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24 },
  pdfIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  pdfInfo: { flex: 1, marginLeft: 15 },
  pdfTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  pdfMeta: { fontSize: 11, fontWeight: '500' },
  emptyBox: { padding: 30, borderRadius: 24, alignItems: 'center' },
});
