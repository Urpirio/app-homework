import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
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
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarScreen() {
  const { theme } = useTheme();
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    const map = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return map[day];
  });
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Record<string, any[]>>({});
  const [tasksByDay, setTasksByDay] = useState<Record<string, any[]>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, projectsRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/projects')
      ]);

      // Process Schedules
      const scheduleMap: Record<string, any[]> = {};
      schedulesRes.data.forEach((s: any) => {
        if (!scheduleMap[s.day]) scheduleMap[s.day] = [];
        scheduleMap[s.day].push({
          id: s.projectId,
          name: s.project?.name || 'Materia',
          time: `${s.startTime} - ${s.endTime}`,
          room: s.room || 'Aula TBD',
          icon: s.project?.icon || 'book'
        });
      });
      setSchedules(scheduleMap);

      // Process Tasks
      const taskMap: Record<string, any[]> = {};
      const dayMapNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      projectsRes.data.forEach((p: any) => {
        (p.tasks || []).forEach((t: any) => {
          if (t.dueDate) {
            const date = new Date(t.dueDate);
            const dayName = dayMapNames[date.getDay()];
            if (!taskMap[dayName]) taskMap[dayName] = [];
            taskMap[dayName].push({
              id: t.id,
              title: t.title,
              subject: p.name,
              type: t.type === 'EXAM' ? 'Examen' : 'Entrega'
            });
          }
        });
      });
      setTasksByDay(taskMap);

    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const currentSchedule = schedules[selectedDay] || [];
  const currentTasks = tasksByDay[selectedDay] || [];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
              const hasTasks = !!tasksByDay[day] && tasksByDay[day].length > 0;
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
            {currentSchedule.length > 0 ? currentSchedule.map((item, index) => (
              <Animated.View key={`${item.id}-${index}`} entering={FadeInRight.delay(index * 100)}>
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
            {currentTasks.length > 0 ? currentTasks.map((task, index) => (
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
