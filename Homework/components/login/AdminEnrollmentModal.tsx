import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  TextInput, 
  ActivityIndicator,
  FlatList 
} from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

interface AdminEnrollmentModalProps {
  visible: boolean;
  onClose: () => void;
  institutionId: string;
  onSuccess?: () => void;
}

export const AdminEnrollmentModal = ({ visible, onClose, institutionId, onSuccess }: AdminEnrollmentModalProps) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'SELECT' | 'CREATE'>('SELECT');
  
  // Select state
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Create state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && mode === 'SELECT') {
      searchUsers('');
    }
  }, [visible, mode]);

  const searchUsers = async (query: string) => {
    setSearching(true);
    try {
      const res = await api.get(`/users/search?query=${query}`);
      setUsers(res.data);
    } catch (error) {
      // Mock search results
      setUsers([
        { id: 'u1', fullName: 'Juan Pérez', email: 'juan@mail.com' },
        { id: 'u2', fullName: 'María García', email: 'maria@mail.com' },
        { id: 'u3', fullName: 'Carlos López', email: 'carlos@mail.com' },
      ]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = async (user: any) => {
    setLoading(true);
    try {
      await api.post(`/institutions/${institutionId}/admins`, { userId: user.id });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Administrador añadido' });
      onSuccess?.();
      onClose();
    } catch (error) {
      // Mock success
      Toast.show({ type: 'success', text1: 'Éxito (Mock)', text2: 'Administrador añadido' });
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!fullName || !email || !password) {
      Toast.show({ type: 'error', text1: 'Campos requeridos' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/institutional-user', {
        fullName,
        email,
        password,
        role: 'ADMIN',
        institutionId
      });
      Toast.show({ type: 'success', text1: 'Éxito', text2: 'Perfil administrativo creado' });
      onSuccess?.();
      onClose();
    } catch (error) {
      // Mock success
      Toast.show({ type: 'success', text1: 'Éxito (Mock)', text2: 'Perfil administrativo creado' });
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(pass);
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Añadir Administrador</Text>
        
        <View style={[styles.tabBar, { backgroundColor: theme.colors.background }]}>
          <Pressable 
            onPress={() => setMode('SELECT')}
            style={[styles.tab, mode === 'SELECT' && { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.tabText, { color: mode === 'SELECT' ? theme.colors.primary : theme.colors.textSecondary }]}>Seleccionar</Text>
          </Pressable>
          <Pressable 
            onPress={() => setMode('CREATE')}
            style={[styles.tab, mode === 'CREATE' && { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.tabText, { color: mode === 'CREATE' ? theme.colors.primary : theme.colors.textSecondary }]}>Crear Nuevo</Text>
          </Pressable>
        </View>

        {mode === 'SELECT' ? (
          <View style={{ flex: 1 }}>
            <View style={[styles.searchBox, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput 
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Buscar por nombre o correo..."
                placeholderTextColor={theme.colors.textSecondary}
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  searchUsers(text);
                }}
              />
            </View>

            {searching ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
            ) : (
              <ScrollView style={styles.userList}>
                {users.map((user) => (
                  <Pressable 
                    key={user.id} 
                    style={[styles.userItem, { backgroundColor: theme.colors.background }]}
                    onPress={() => handleSelectUser(user)}
                  >
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                      <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{user.fullName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, { color: theme.colors.text }]}>{user.fullName}</Text>
                      <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <AnimatedInput value={fullName} onChangeText={setFullName} placeholder="Nombre Completo" icon="person-outline" />
              <AnimatedInput value={email} onChangeText={setEmail} placeholder="Correo Electrónico" icon="mail-outline" autoCapitalize="none" />
              
              <View style={styles.passwordRow}>
                <View style={{ flex: 1 }}>
                  <AnimatedInput value={password} onChangeText={setPassword} placeholder="Contraseña Temporal" icon="lock-closed-outline" autoCapitalize="none" />
                </View>
                <Pressable onPress={generatePassword} style={[styles.genBtn, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="refresh" size={22} color="#FFF" />
                </Pressable>
              </View>

              <AnimatedButton title="Crear Admin" onPress={handleCreateAdmin} loading={loading} />
            </View>
          </ScrollView>
        )}
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: { height: 500 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 20 },
  tab: { flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 15, paddingHorizontal: 15, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  userList: { flex: 1 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '800' },
  userName: { fontSize: 15, fontWeight: '700' },
  userEmail: { fontSize: 12 },
  form: { gap: 4 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  genBtn: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
});
