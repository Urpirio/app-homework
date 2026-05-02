import { useTheme } from '@/hooks/useTheme';
import { Task } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle?: () => void;
}

export const TaskItem = ({ task, index, onToggle }: TaskItemProps) => {
  const { theme } = useTheme();

  const isDone = task.status?.toLowerCase() === 'done';
  const isInProgress = task.status?.toLowerCase() === 'in_progress' || task.status?.toLowerCase() === 'in-progress';

  const getStatusColor = () => {
    if (isDone) return theme.colors.success;
    if (isInProgress) return theme.colors.primary;
    return theme.colors.textSecondary;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr; // Fallback to raw string if old data
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getStatusLabel = () => {
    if (isDone) return 'Listo';
    if (isInProgress) return 'En curso';
    return 'Pendiente';
  };

  return (
    <Animated.View entering={FadeInLeft.delay(index * 50)}>
      <Pressable 
        onPress={onToggle}
        style={[styles.container, { backgroundColor: theme.colors.card }]}
      >
        <View 
          style={[
            styles.checkbox, 
            { 
              borderColor: isDone ? theme.colors.success : theme.colors.border,
              backgroundColor: isDone ? theme.colors.success : 'transparent'
            }
          ]}
        >
          {isDone && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>

        <View style={styles.content}>
          <Text 
            style={[
              styles.title, 
              { 
                color: theme.colors.text,
                textDecorationLine: isDone ? 'line-through' : 'none',
                opacity: isDone ? 0.6 : 1
              }
            ]}
          >
            {task.title}
          </Text>
          
          {task.description && !isDone && (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          <View style={styles.footer}>
            {task.dueDate && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {formatDate(task.dueDate)}
                </Text>
              </View>
            )}
            
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
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
