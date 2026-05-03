import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_URL = 'https://app-homework-production.up.railway.app';

const getFullUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const MOCK_STUDENTS = [
  { id: 'u2', name: 'Ana López', role: 'student', avatar: null, isContact: true },
  { id: 'u3', name: 'Carlos Ruiz', role: 'student', avatar: null, isContact: false },
  { id: 'u5', name: 'María García', role: 'student', avatar: null, isContact: false },
  { id: 'u6', name: 'Juan Pérez', role: 'student', avatar: null, isContact: true },
  { id: 'u7', name: 'Lucía Fernández', role: 'student', avatar: null, isContact: false },
  { id: 'u8', name: 'Roberto Gómez', role: 'student', avatar: null, isContact: false },
];

const SubjectStudentsScreen = () => {
  const { id, name } = useLocalSearchParams();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchStudents = async () => {
    try {
      if (typeof id === 'string' && !id.startsWith('m')) {
        const response = await api.get(`/projects/${id}`);
        const members = response.data.members || [];
        setStudents(members
          .filter((m: any) => m.role === 'student')
          .map((m: any) => ({
            id: m.user.id,
            name: m.user.fullName,
            avatar: m.user.avatarUrl,
            isContact: false
          }))
        );
      } else {
        setStudents(MOCK_STUDENTS);
      }
    } catch (error) {
      setStudents(MOCK_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [id])
  );

  const handleStudentPress = (student: any) => {
    if (student.isContact) {
      router.push({
        pathname: '/chat/[id]',
        params: { id: student.id, name: student.name, type: 'user' }
      });
    } else {
      setSelectedStudent(student);
      setIsModalVisible(true);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Alumnos</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{name || 'Materia'}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar compañero..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 50)}>
                  <Pressable 
                    onPress={() => handleStudentPress(item)}
                    style={[styles.studentCard, { backgroundColor: theme.colors.card }]}
                  >
                    <View style={[styles.avatar, { backgroundColor: item.isContact ? theme.colors.primaryLight : theme.colors.border }]}>
                      <Text style={[styles.avatarText, { color: item.isContact ? theme.colors.primary : theme.colors.textSecondary }]}>{item.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: theme.colors.text }]}>{item.name}</Text>
                      <Text style={[styles.studentRole, { color: theme.colors.textSecondary }]}>{item.isContact ? 'Contacto' : 'Estudiante'}</Text>
                    </View>
                    <Ionicons name={item.isContact ? "chatbubble" : "person-add-outline"} size={20} color={item.isContact ? theme.colors.primary : theme.colors.border} />
                  </Pressable>
                </Animated.View>
              )}
            />
          )}
        </View>

        {/* Modal Conexión */}
        <Modal visible={isModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.modalAvatar, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.modalAvatarText, { color: theme.colors.primary }]}>{selectedStudent?.name.charAt(0)}</Text>
              </View>
              <Text style={[styles.modalName, { color: theme.colors.text }]}>{selectedStudent?.name}</Text>
              <Text style={{ textAlign: 'center', marginBottom: 25, color: theme.colors.textSecondary }}>Aún no están conectados.</Text>
              <View style={{ width: '100%', gap: 10 }}>
                <Pressable 
                  onPress={() => { setIsModalVisible(false); Toast.show({ type: 'success', text1: 'Solicitud enviada' }); }}
                  style={[styles.primaryAction, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Enviar Solicitud</Text>
                </Pressable>
                <Pressable 
                  onPress={() => {
                    setIsModalVisible(false);
                    router.push({ pathname: '/collaborator/[id]', params: { id: selectedStudent?.id, name: selectedStudent?.name } });
                  }}
                  style={[styles.secondaryAction, { borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Ver Perfil Académico</Text>
                </Pressable>
                <Pressable onPress={() => setIsModalVisible(false)} style={{ alignItems: 'center', padding: 10 }}>
                  <Text style={{ color: theme.colors.textSecondary }}>Cancelar</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

      </ThemedView>
    </SafeAreaView>
  );
};

export default SubjectStudentsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#00000005' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  studentCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  studentInfo: { flex: 1, marginLeft: 14 },
  studentName: { fontSize: 16, fontWeight: '700' },
  studentRole: { fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 340, padding: 30, borderRadius: 32, alignItems: 'center' },
  modalAvatar: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalAvatarText: { fontSize: 32, fontWeight: '900' },
  modalName: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  primaryAction: { padding: 16, borderRadius: 18, alignItems: 'center' },
  secondaryAction: { padding: 16, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
});
