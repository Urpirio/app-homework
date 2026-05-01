import { useTheme } from '@/hooks/useTheme';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface ProjectCardProps {
  project: Project;
  index: number;
  onLongPress?: () => void;
}

export const ProjectCard = ({ project, index, onLongPress }: ProjectCardProps) => {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInRight.delay(index * 100)}>
      <Pressable 
        onPress={() => router.push(`/projects/${project.id}`)}
        onLongPress={onLongPress}
        style={[styles.container, { backgroundColor: theme.colors.card }]}
      >
        <View style={[styles.iconContainer, { backgroundColor: project.color + '20' }]}>
          <Ionicons name="folder" size={24} color={project.color} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={[styles.stats, { color: theme.colors.textSecondary }]}>
            {project.completedTasks}/{project.tasksCount} tareas completadas
          </Text>
          
          <View style={styles.progressRow}>
            <View style={[styles.progressBarBase, { backgroundColor: theme.colors.border }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { backgroundColor: project.color, width: `${project.progress}%` }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {project.progress}%
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stats: {
    fontSize: 12,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBase: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    width: 35,
  },
});
