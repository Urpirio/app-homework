import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ActivityIndicator,
  Image,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/utils/api';
import { useFocusEffect } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollaboratorsScreen() {
  const { theme } = useTheme();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollaborators = async () => {
    try {
      // Por ahora simulamos, en el futuro esto vendría del backend
      // await api.get('/collaborators');
      setTimeout(() => {
        setCollaborators([
          { id: '1', name: 'Ana García', role: 'Diseñadora UI', avatar: null },
          { id: '2', name: 'Carlos López', role: 'Frontend Dev', avatar: null },
          { id: '3', name: 'Elena Rivas', role: 'Product Manager', avatar: null },
          { id: '4', name: 'Miguel Torres', role: 'Backend Dev', avatar: null },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCollaborators();
    }, [])
  );

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Colaboradores</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.list}>
                {collaborators.map((collab, index) => (
                  <Animated.View 
                    key={collab.id} 
                    entering={FadeInDown.delay(index * 100)}
                    style={[styles.card, { backgroundColor: theme.colors.card }]}
                  >
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                      <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                        {collab.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.content}>
                      <Text style={[styles.name, { color: theme.colors.text }]}>{collab.name}</Text>
                      <Text style={[styles.role, { color: theme.colors.textSecondary }]}>{collab.role}</Text>
                    </View>
                    <Pressable style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
                    </Pressable>
                  </Animated.View>
                ))}
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
  header: {
    paddingVertical: 20,
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '800' },
  list: {
    gap: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  name: { fontSize: 16, fontWeight: '700' },
  role: { fontSize: 13, marginTop: 2 },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
