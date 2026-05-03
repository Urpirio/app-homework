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

export default function TeacherStudentsScreen() {
  const { id, teacherId } = useLocalSearchParams<{ id: string, teacherId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStudents();
  }, [teacherId]);

  const fetchTeacherStudents = async () => {
    try {
      const res = await api.get(`/teachers/${teacherId}/students`);
      setStudents(res.data);
    } catch (error) {
      // Mock data
      setStudents([
        { id: 's1', fullName: 'Juan Pérez', classroom: '6to A', email: 'juan@mail.com' },
        { id: 's2', fullName: 'María García', classroom: '5to B', email: 'maria@mail.com' },
        { id: 's3', fullName: 'Carlos López', classroom: '6to A', email: 'carlos@mail.com' },
        { id: 's4', fullName: 'Ana Martínez', classroom: '4to C', email: 'ana@mail.com' },
        { id: 's5', fullName: 'Luis Rodríguez', classroom: '6to B', email: 'luis@mail.com' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.classroom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Alumnos del Maestro</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            placeholder="Buscar por nombre o aula..."
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
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/admin/institution/${id}/student/${item.id}`)}
                style={({ pressed }) => [
                  styles.studentCard, 
                  { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                    {item.fullName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: theme.colors.text }]}>{item.fullName}</Text>
                  <Text style={[styles.studentClass, { color: theme.colors.textSecondary }]}>
                    {item.classroom} • {item.email}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.colors.textSecondary }}>No se encontraron alumnos</Text>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
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
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
  },
  studentClass: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
});
