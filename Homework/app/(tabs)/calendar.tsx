/**
 * Calendar Screen
 *
 * Displays a unified calendar view merging academic schedules from
 * GET /schedules and task deadlines from GET /tasks/calendar into
 * a single CalendarEvent[] array. Supports monthly/weekly views with
 * swipe navigation, a "today" quick-return button, day detail view,
 * and deadline proximity indicators for tasks within 48 hours.
 *
 * Teachers can create and delete schedule entries with conflict detection.
 *
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 12.8
 */

import { CreateScheduleModal } from '@/components/calendar/CreateScheduleModal';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useDeleteSchedule, useSchedules } from '@/hooks/api/useSchedules';
import { useCalendarTasks } from '@/hooks/api/useTasks';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useTheme } from '@/hooks/useTheme';
import {
  addMonths,
  addWeeks,
  CalendarEvent,
  DAY_NAMES_FULL,
  endOfWeek,
  EVENT_COLORS,
  getMonthGridDates,
  getWeekDates,
  isSameDay,
  mergeCalendarEvents,
  MONTH_NAMES,
  startOfWeek,
  toDateKey,
} from '@/utils/calendarHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ViewMode = 'monthly' | 'weekly';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CalendarScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Teacher schedule management state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Role-based access
  const { data: profile } = useProfile();
  const { canPerformAction } = useRouteGuard(profile?.role ?? null);
  const canCreateSchedule = canPerformAction('createSchedule');

  // Delete mutation with undo capability (Req 19.8)
  const deleteSchedule = useDeleteSchedule();

  // Compute date range for data fetching based on view mode
  const { rangeStart, rangeEnd, startDateStr, endDateStr } = useMemo(() => {
    let start: Date;
    let end: Date;
    if (viewMode === 'monthly') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), -6);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 7);
    } else {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    }
    return {
      rangeStart: start,
      rangeEnd: end,
      startDateStr: start.toISOString().split('T')[0],
      endDateStr: end.toISOString().split('T')[0],
    };
  }, [currentDate, viewMode]);

  // Fetch data via React Query hooks
  const {
    data: schedulesData,
    isLoading: schedulesLoading,
    isError: schedulesError,
    error: schedulesErrorObj,
    refetch: refetchSchedules,
  } = useSchedules();

  const {
    data: calendarTasksData,
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksErrorObj,
    refetch: refetchTasks,
  } = useCalendarTasks(startDateStr, endDateStr);

  const isLoading = schedulesLoading || tasksLoading;
  const isError = schedulesError || tasksError;
  const errorObj = schedulesErrorObj || tasksErrorObj;

  const refetchAll = useCallback(() => {
    refetchSchedules();
    refetchTasks();
  }, [refetchSchedules, refetchTasks]);

  // Merge into unified events
  const events = useMemo(() => {
    const schedules = schedulesData ?? [];
    const tasks = calendarTasksData?.tasks ?? [];
    return mergeCalendarEvents(schedules, tasks, rangeStart, rangeEnd);
  }, [schedulesData, calendarTasksData, rangeStart, rangeEnd]);

  // Group events by date key for quick lookup
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    }
    return map;
  }, [events]);

  // Navigation handlers
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }, []);

  const goNext = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'monthly' ? addMonths(prev, 1) : addWeeks(prev, 1),
    );
  }, [viewMode]);

  const goPrev = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === 'monthly' ? addMonths(prev, -1) : addWeeks(prev, -1),
    );
  }, [viewMode]);

  const handleDatePress = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleEventPress = useCallback((event: CalendarEvent) => {
    if (event.type === 'deadline' && event.entityId) {
      router.push(`/tasks/${event.entityId}`);
    } else if (event.type === 'schedule' && event.entityId) {
      router.push(`/projects/${event.entityId}`);
    }
  }, []);

  const handleDeleteSchedule = useCallback((event: CalendarEvent) => {
    // Extract the real schedule ID from the composite event ID (format: schedule-{id}-{dateKey})
    const parts = event.id.split('-');
    // The schedule ID is between 'schedule-' and the last date part
    const scheduleId = parts.slice(1, -3).join('-') || parts[1];
    setDeleteTarget({ id: scheduleId, title: event.title });
  }, []);

  const confirmDeleteSchedule = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchedule.mutateAsync(deleteTarget.id);
      Toast.show({
        type: 'success',
        text1: 'Horario eliminado',
        text2: `${deleteTarget.title} fue removido del calendario`,
        visibilityTime: 3000,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo eliminar el horario',
        visibilityTime: 3000,
      });
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteSchedule]);

  // Grid dates
  const gridDates = useMemo(() => {
    return viewMode === 'monthly' ? getMonthGridDates(currentDate) : getWeekDates(currentDate);
  }, [currentDate, viewMode]);

  // Selected day events
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null;
  const selectedEvents = selectedDateKey ? eventsByDate[selectedDateKey] ?? [] : [];

  // Count urgent deadlines for badge (Property 33)
  const urgentCount = useMemo(() => events.filter((e) => e.isUrgent).length, [events]);

  // Header title
  const headerTitle = useMemo(() => {
    if (viewMode === 'monthly') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    const ws = startOfWeek(currentDate);
    const we = endOfWeek(currentDate);
    if (ws.getMonth() === we.getMonth()) {
      return `${ws.getDate()} – ${we.getDate()} ${MONTH_NAMES[ws.getMonth()]}`;
    }
    return `${ws.getDate()} ${MONTH_NAMES[ws.getMonth()].slice(0, 3)} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()].slice(0, 3)}`;
  }, [currentDate, viewMode]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calendario</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Gestiona tu tiempo académico
            </Text>
          </View>
          <SkeletonLoader rows={6} variant="list-item" style={{ paddingHorizontal: 25 }} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calendario</Text>
          </View>
          <ErrorState
            error={errorObj ?? new Error('Error al cargar el calendario')}
            onRetry={refetchAll}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Calendario</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                Gestiona tu tiempo académico
              </Text>
            </View>
            {urgentCount > 0 && (
              <View style={[styles.urgentBadge, { backgroundColor: theme.colors.error }]}>
                <Ionicons name="alert-circle" size={14} color="#FFF" />
                <Text style={styles.urgentBadgeText}>{urgentCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* View mode toggle + navigation */}
        <View style={styles.controlsRow}>
          <View style={[styles.viewToggle, { backgroundColor: theme.colors.inputBackground }]}>
            <Pressable
              onPress={() => setViewMode('monthly')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'monthly' && { backgroundColor: theme.colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Vista mensual"
            >
              <Text
                style={[
                  styles.viewToggleText,
                  { color: viewMode === 'monthly' ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                Mes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('weekly')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'weekly' && { backgroundColor: theme.colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Vista semanal"
            >
              <Text
                style={[
                  styles.viewToggleText,
                  { color: viewMode === 'weekly' ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                Semana
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={goToToday}
            style={[styles.todayBtn, { borderColor: theme.colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Ir a hoy"
          >
            <Text style={[styles.todayBtnText, { color: theme.colors.primary }]}>Hoy</Text>
          </Pressable>
        </View>

        {/* Month/Week navigation */}
        <View style={styles.navRow}>
          <Pressable onPress={goPrev} hitSlop={12} accessibilityRole="button" accessibilityLabel="Anterior">
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.colors.text }]}>{headerTitle}</Text>
          <Pressable onPress={goNext} hitSlop={12} accessibilityRole="button" accessibilityLabel="Siguiente">
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: EVENT_COLORS.schedule }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Clases</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: EVENT_COLORS.deadline }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Entregas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: EVENT_COLORS.event }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Eventos</Text>
            </View>
          </View>

          {/* Day headers (Mon–Sun) */}
          <View style={styles.dayHeaderRow}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <View key={d} style={styles.dayHeaderCell}>
                <Text style={[styles.dayHeaderText, { color: theme.colors.textSecondary }]}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {gridDates.map((date) => {
              const key = toDateKey(date);
              const dayEvents = eventsByDate[key] ?? [];
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const hasUrgent = dayEvents.some((e) => e.isUrgent);

              return (
                <Pressable
                  key={key}
                  onPress={() => handleDatePress(date)}
                  style={[
                    styles.dateCell,
                    isSelected && { backgroundColor: theme.colors.primaryLight },
                    isToday && !isSelected && { borderWidth: 2, borderColor: theme.colors.primary },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: isCurrentMonth ? theme.colors.text : theme.colors.border },
                      isSelected && { color: theme.colors.primary, fontWeight: '800' },
                      isToday && !isSelected && { color: theme.colors.primary, fontWeight: '800' },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {/* Event dots */}
                  <View style={styles.dotRow}>
                    {dayEvents.some((e) => e.type === 'schedule') && (
                      <View style={[styles.eventDot, { backgroundColor: EVENT_COLORS.schedule }]} />
                    )}
                    {dayEvents.some((e) => e.type === 'deadline') && (
                      <View style={[styles.eventDot, { backgroundColor: EVENT_COLORS.deadline }]} />
                    )}
                    {dayEvents.some((e) => e.type === 'event') && (
                      <View style={[styles.eventDot, { backgroundColor: EVENT_COLORS.event }]} />
                    )}
                  </View>
                  {/* Urgent indicator — Property 33 */}
                  {hasUrgent && (
                    <View style={styles.urgentDot}>
                      <Ionicons name="alert-circle" size={10} color="#FF3B30" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Day detail view */}
          {selectedDate && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.dayDetail}>
              <View style={styles.dayDetailHeader}>
                <Text style={[styles.dayDetailTitle, { color: theme.colors.text }]}>
                  {DAY_NAMES_FULL[selectedDate.getDay()]} {selectedDate.getDate()} de{' '}
                  {MONTH_NAMES[selectedDate.getMonth()]}
                </Text>
                <Text style={[styles.dayDetailCount, { color: theme.colors.textSecondary }]}>
                  {selectedEvents.length} {selectedEvents.length === 1 ? 'evento' : 'eventos'}
                </Text>
              </View>

              {selectedEvents.length === 0 ? (
                <View style={[styles.emptyDay, { backgroundColor: theme.colors.card }]}>
                  <Ionicons name="calendar-outline" size={32} color={theme.colors.textSecondary} />
                  <Text style={[styles.emptyDayText, { color: theme.colors.textSecondary }]}>
                    Sin eventos para este día
                  </Text>
                </View>
              ) : (
                selectedEvents.map((event, index) => (
                  <Animated.View key={event.id} entering={FadeInRight.delay(index * 80)}>
                    <Pressable
                      onPress={() => handleEventPress(event)}
                      style={[styles.eventCard, { backgroundColor: theme.colors.card }]}
                      accessibilityRole="button"
                      accessibilityLabel={`${event.title} - ${event.subtitle ?? ''}`}
                    >
                      <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                      <View style={styles.eventContent}>
                        <View style={styles.eventTopRow}>
                          <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={1}>
                            {event.title}
                          </Text>
                          {event.isUrgent && (
                            <View style={styles.urgentTag}>
                              <Ionicons name="alert-circle" size={12} color="#FF3B30" />
                              <Text style={styles.urgentTagText}>Próximo</Text>
                            </View>
                          )}
                        </View>
                        {event.subtitle && (
                          <Text
                            style={[styles.eventSubtitle, { color: theme.colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {event.subtitle}
                          </Text>
                        )}
                        <View style={styles.eventMeta}>
                          {event.startTime && (
                            <View style={styles.eventMetaItem}>
                              <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
                              <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                                {event.startTime}
                                {event.endTime ? ` – ${event.endTime}` : ''}
                              </Text>
                            </View>
                          )}
                          <View style={styles.eventMetaItem}>
                            <Ionicons
                              name={event.type === 'schedule' ? 'school-outline' : 'document-text-outline'}
                              size={12}
                              color={theme.colors.textSecondary}
                            />
                            <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                              {event.type === 'schedule' ? 'Clase' : event.type === 'deadline' ? 'Entrega' : 'Evento'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.eventActions}>
                        {/* Delete button for schedule events (teacher only) */}
                        {canCreateSchedule && event.type === 'schedule' && (
                          <Pressable
                            onPress={() => handleDeleteSchedule(event)}
                            hitSlop={8}
                            style={styles.deleteBtn}
                            accessibilityRole="button"
                            accessibilityLabel={`Eliminar ${event.title}`}
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.colors.error ?? '#FF3B30'} />
                          </Pressable>
                        )}
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
                      </View>
                    </Pressable>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* FAB — Create schedule (teacher only) */}
        {canCreateSchedule && (
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Crear nuevo horario"
          >
            <Ionicons name="add" size={28} color="#FFF" />
          </Pressable>
        )}

        {/* Create schedule modal */}
        <CreateScheduleModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        {/* Delete confirmation modal */}
        <ConfirmModal
          visible={!!deleteTarget}
          title="Eliminar horario"
          message={`¿Eliminar "${deleteTarget?.title}" del calendario?`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onConfirm={confirmDeleteSchedule}
          onClose={() => setDeleteTarget(null)}
          isDestructive
        />
      </ThemedView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CELL_SIZE = Math.floor((SCREEN_WIDTH - 50) / 7);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  urgentBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  viewToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewToggleText: { fontSize: 13, fontWeight: '700' },
  todayBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  todayBtnText: { fontSize: 13, fontWeight: '700' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 12,
  },
  navTitle: { fontSize: 17, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 100 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600' },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 4 },
  dayHeaderCell: { width: CELL_SIZE, alignItems: 'center' },
  dayHeaderText: { fontSize: 11, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  dateText: { fontSize: 14, fontWeight: '600' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6 },
  eventDot: { width: 5, height: 5, borderRadius: 2.5 },
  urgentDot: { position: 'absolute', top: 2, right: 4 },
  dayDetail: { marginTop: 20 },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDetailTitle: { fontSize: 17, fontWeight: '800' },
  dayDetailCount: { fontSize: 13, fontWeight: '600' },
  emptyDay: {
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyDayText: { fontSize: 14, fontWeight: '500' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
  },
  eventColorBar: { width: 4, alignSelf: 'stretch' },
  eventContent: { flex: 1, padding: 14 },
  eventTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  eventSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  eventMeta: { flexDirection: 'row', gap: 14, marginTop: 6 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { fontSize: 11, fontWeight: '500' },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgentTagText: { fontSize: 10, fontWeight: '700', color: '#FF3B30' },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
