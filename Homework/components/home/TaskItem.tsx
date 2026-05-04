import { useTheme } from '@/hooks/useTheme';
import { Task } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

interface TaskItemProps {
  task: Task;
  index: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const TaskItem = ({ task, index, onPress, onLongPress }: TaskItemProps) => {
  const { theme } = useTheme();

  // A student's task is "done" if they have a submission, regardless of task.status
  const mySubmission = (task as any)?.mySubmission;
  const hasSubmission = !!mySubmission;
  const isGraded = mySubmission?.status === 'GRADED' || mySubmission?.status === 'RETURNED';

  // Overdue: past due date, no submission
  const isOverdue = !hasSubmission &&
    !!task.dueDate &&
    new Date(task.dueDate) < new Date();

  const isDone = hasSubmission || task.status?.toLowerCase() === 'done';
  const isInProgress = !hasSubmission && !isOverdue && (
    task.status?.toLowerCase() === 'in_progress' ||
    task.status?.toLowerCase() === 'in-progress'
  );

  const getStatusColor = () => {
    if (isGraded) return '#34C759';
    if (isDone) return theme.colors.primary;
    if (isOverdue) return '#FF3B30';
    if (isInProgress) return theme.colors.primary;
    return theme.colors.textSecondary;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getStatusLabel = () => {
    if (isGraded) return 'Calificada';
    if (hasSubmission) return 'Entregada';
    if (isOverdue) return 'Vencida';
    if (isInProgress) return 'En curso';
    return 'Pendiente';
  };

  return (
    <Animated.View entering={FadeInLeft.delay(index * 50)}>
      <Pressable 
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        style={[styles.container, { backgroundColor: theme.colors.card }]}
      >
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '10' }]}>
          <Ionicons 
            name={isDone ? "document-text" : isOverdue ? "alert-circle" : "document-outline"} 
            size={20} 
            color={getStatusColor()} 
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {task.title}
          </Text>
          
          {task.description && (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {task.description}
            </Text>
          )}

          <View style={styles.footer}>
            {task.createdAt && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {formatDate(task.createdAt)}
                </Text>
              </View>
            )}
            
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.border} style={{ alignSelf: 'center' }} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
