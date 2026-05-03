import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MOCK_SCHEDULE: Record<string, any[]> = {
  'Lun': [
    { id: 'm1', name: 'Matemáticas IV', time: '07:00 - 08:30', room: 'Aula 204', icon: 'calculator' },
    { id: 'm2', name: 'Historia Universal', time: '08:45 - 10:15', room: 'Aula 102', icon: 'book' },
    { id: 'm3', name: 'Física I', time: '10:30 - 12:00', room: 'Laboratorio A', icon: 'flask' },
  ],
  'Mar': [
    { id: 'm4', name: 'Literatura', time: '07:00 - 08:30', room: 'Aula 301', icon: 'library' },
    { id: 'm5', name: 'Química', time: '09:00 - 11:00', room: 'Laboratorio B', icon: 'color-filter' },
  ],
  'Mié': [
    { id: 'm1', name: 'Matemáticas IV', time: '07:00 - 08:30', room: 'Aula 204', icon: 'calculator' },
    { id: 'm6', name: 'Inglés III', time: '11:00 - 12:30', room: 'Aula 105', icon: 'language' },
  ]
};

const MOCK_TASKS_BY_DAY: Record<string, any[]> = {
  'Lun': [{ id: 't1', title: 'Guía de Identidades', subject: 'Matemáticas', type: 'Entrega' }],
  'Mié': [{ id: 't2', title: 'Examen de Límites', subject: 'Matemáticas', type: 'Examen' }],
  'Vie': [{ id: 't4', title: 'Ensayo Revolución', subject: 'Historia', type: 'Entrega' }]
};

export default function CalendarScreen() {
  const { theme } = useTheme();
  const [selectedDay, setSelectedDay] = useState('Lun');

  const schedule = MOCK_SCHEDULE[selectedDay] || [];
  const tasks = MOCK_TASKS_BY_DAY[selectedDay] || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calendario</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Gestiona tu tiempo académico</Text>
        </View>

        {/* Selector de Días Horizontal */}
        <View style={styles.daySelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayList}>
            {DAYS.map((day) => {
              const isSelected = selectedDay === day;
              const hasTasks = !!MOCK_TASKS_BY_DAY[day];
              return (
                <Pressable 
                  key={day} 
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.dayItem, 
                    { backgroundColor: isSelected ? theme.colors.primary : theme.colors.card }
                  ]}
                >
                  <Text style={[styles.dayText, { color: isSelected ? '#FFF' : theme.colors.textSecondary }]}>{day}</Text>
                  {hasTasks && <View style={[styles.taskDot, { backgroundColor: isSelected ? '#FFF' : theme.colors.primary }]} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Sección de Horario */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Horario de Clases</Text>
            </View>
            {schedule.length > 0 ? schedule.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInRight.delay(index * 100)}>
                <Pressable 
                  onPress={() => router.push(`/projects/${item.id}`)}
                  style={[styles.classCard, { backgroundColor: theme.colors.card }]}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name={item.icon as any} size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={[styles.className, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.classMeta, { color: theme.colors.textSecondary }]}>{item.time} • {item.room}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
                </Pressable>
              </Animated.View>
            )) : (
              <View style={[styles.emptyBox, { backgroundColor: theme.colors.card }]}>
                <Text style={{ color: theme.colors.textSecondary }}>No hay clases programadas para hoy.</Text>
              </View>
            )}
          </View>

          {/* Sección de Entregas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={20} color="#FF9500" />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Entregas y Pendientes</Text>
            </View>
            {tasks.length > 0 ? tasks.map((task, index) => (
              <Animated.View key={task.id} entering={FadeInDown.delay(index * 100)}>
                <Pressable 
                  onPress={() => router.push(`/tasks/${task.id}`)}
                  style={[styles.taskCard, { backgroundColor: theme.colors.card }]}
                >
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                    <Text style={[styles.taskSub, { color: theme.colors.textSecondary }]}>{task.subject} • {task.type}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.border} />
                </Pressable>
              </Animated.View>
            )) : (
              <View style={[styles.emptyBox, { backgroundColor: theme.colors.card }]}>
                <Text style={{ color: theme.colors.textSecondary }}>Libre de entregas hoy. ✨</Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  daySelectorContainer: { marginBottom: 20 },
  dayList: { paddingHorizontal: 25, gap: 12 },
  dayItem: { 
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  dayText: { fontSize: 14, fontWeight: '800' },
  taskDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 10 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 100 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  classCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  classInfo: { marginLeft: 16, flex: 1 },
  className: { fontSize: 16, fontWeight: '700' },
  classMeta: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, marginBottom: 10 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  taskSub: { fontSize: 12, fontWeight: '500' },
  emptyBox: { padding: 25, borderRadius: 22, alignItems: 'center' },
});
