import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

export default function ClassroomListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassrooms();
  }, [id]);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get(`/institutions/${id}/classrooms`);
      setClassrooms(res.data);
    } catch (error) {
      // Mock data
      setClassrooms([
        { id: 'c1', name: '6to A - Ciencias', description: 'Aula de ciencias naturales' },
        { id: 'c2', name: '5to B - Matemáticas', description: 'Aula de álgebra y geometría' },
        { id: 'c3', name: '4to C - Historia', description: 'Aula de historia universal' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClassrooms = classrooms.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>Listado de Aulas</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            placeholder="Buscar aula..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredClassrooms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ClassroomItem 
                classroom={item} 
                onPress={() => router.push(`/admin/institution/${id}/classroom/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No se encontraron aulas
                </Text>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const ClassroomItem = ({ classroom, onPress }: { classroom: any, onPress: () => void }) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.classroomCard, 
        { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: '#FF9500' + '20' }]}>
        <Ionicons name="book" size={24} color="#FF9500" />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.text }]}>{classroom.name}</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {classroom.description || 'Sin descripción'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  classroomCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, fontWeight: '600' },
});
