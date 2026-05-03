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
  ActivityIndicator,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/utils/api';

export default function TeacherListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, [id]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get(`/institutions/${id}/teachers`);
      setTeachers(res.data);
    } catch (error) {
      // Mock data
      setTeachers([
        { id: 't1', fullName: 'Prof. Alberto Ruiz', email: 'alberto@school.com', specialty: 'Matemáticas' },
        { id: 't2', fullName: 'Dra. Elena Blanc', email: 'elena@school.com', specialty: 'Ciencias' },
        { id: 't3', fullName: 'Ing. Ricardo Sosa', email: 'ricardo@school.com', specialty: 'Tecnología' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.fullName.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>Listado de Maestros</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            placeholder="Buscar maestro..."
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
            data={filteredTeachers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TeacherItem 
                teacher={item} 
                onPress={() => router.push(`/admin/institution/${id}/teacher/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No se encontraron maestros
                </Text>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const TeacherItem = ({ teacher, onPress }: { teacher: any, onPress: () => void }) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.teacherCard, 
        { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: '#5856D6' + '20' }]}>
        <Ionicons name="person" size={24} color="#5856D6" />
      </View>
      <View style={styles.teacherInfo}>
        <Text style={[styles.teacherName, { color: theme.colors.text }]}>{teacher.fullName}</Text>
        <Text style={[styles.teacherEmail, { color: theme.colors.textSecondary }]}>{teacher.specialty || teacher.email}</Text>
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
  teacherCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: '700' },
  teacherEmail: { fontSize: 14, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, fontWeight: '600' },
});
