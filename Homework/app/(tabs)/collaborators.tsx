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
  Pressable,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/utils/api';
import { useFocusEffect, router } from 'expo-router';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollaboratorsScreen() {
  const { theme } = useTheme();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollab, setSelectedCollab] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [identityCode, setIdentityCode] = useState('');
  const [foundCollab, setFoundCollab] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitationSent, setInvitationSent] = useState(false);

  const fetchCollaborators = async () => {
    try {
      // Por ahora simulamos, en el futuro esto vendría del backend
      // await api.get('/collaborators');
      setTimeout(() => {
        setCollaborators([
          { id: '1', name: 'Ana García', role: 'Diseñadora UI', avatar: null, status: 'active' },
          { id: '2', name: 'Carlos López', role: 'Frontend Dev', avatar: null, status: 'active' },
          { id: '3', name: 'Elena Rivas', role: 'Product Manager', avatar: null, status: 'active' },
          { id: '4', name: 'Miguel Torres', role: 'Backend Dev', avatar: null, status: 'active' },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (identityCode.trim() === '') return;
    setIsSearching(true);
    
    // Simular búsqueda en el backend
    setTimeout(() => {
      // Simulamos que encontramos a alguien
      setFoundCollab({
        id: '99',
        name: 'Roberto Sánchez',
        role: 'Tech Lead',
        identityCode: identityCode,
        avatar: null,
        status: 'pending'
      });
      setIsSearching(false);
    }, 800);
  };

  const handleConfirmAdd = () => {
    if (!foundCollab) return;
    
    // Evitar duplicados
    if (collaborators.find(c => c.id === foundCollab.id)) {
      setIsAddModalVisible(false);
      setFoundCollab(null);
      setIdentityCode('');
      return;
    }

    setInvitationSent(true);
    
    // Después de un momento cerramos el modal y limpiamos
    setTimeout(() => {
      setCollaborators([foundCollab, ...collaborators]);
      setIsAddModalVisible(false);
      setFoundCollab(null);
      setIdentityCode('');
      setInvitationSent(false);
    }, 2500);
  };

  const filteredCollaborators = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <View style={styles.headerTop}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Colaboradores</Text>
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setIsAddModalVisible(true)}
                >
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {/* <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Gestiona tu equipo de trabajo</Text> */}
            </View>

            <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput 
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Buscar por nombre o rol..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.list}>
                {filteredCollaborators.map((collab, index) => (
                  <Animated.View 
                    key={collab.id} 
                    entering={FadeInDown.delay(index * 100)}
                  >
                    <Pressable 
                      style={({ pressed }) => [
                        styles.card, 
                        { backgroundColor: theme.colors.card, opacity: pressed ? 0.7 : 1 }
                      ]}
                      onPress={() => {
                        if (collab.status === 'pending') {
                          Toast.show({
                            type: 'info',
                            text1: 'Solicitud pendiente',
                            text2: 'Debes esperar a que confirme tu solicitud.',
                            position: 'bottom'
                          });
                          return;
                        }
                        router.push({
                          pathname: '/chat/[id]',
                          params: { id: collab.id, name: collab.name }
                        });
                      }}
                      onLongPress={() => {
                        setSelectedCollab(collab);
                        setIsModalVisible(true);
                      }}
                      delayLongPress={500}
                    >
                      <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                        <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                          {collab.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.content}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.name, { color: theme.colors.text }]}>{collab.name}</Text>
                          {collab.status === 'pending' && (
                            <View style={[styles.pendingBadge, { backgroundColor: theme.colors.primaryLight }]}>
                              <Text style={[styles.pendingText, { color: theme.colors.primary }]}>Pendiente</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.role, { color: theme.colors.textSecondary }]}>{collab.role}</Text>
                      </View>
                      <View style={styles.actionButton}>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedView>

      {/* Quick Actions Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            {selectedCollab && (
              <>
                <View style={[styles.modalAvatar, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.modalAvatarText, { color: theme.colors.primary }]}>
                    {selectedCollab.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.modalName, { color: theme.colors.text }]}>{selectedCollab.name}</Text>
                
                <View style={styles.quickActions}>
                  <TouchableOpacity 
                    style={[styles.quickActionBtn, { backgroundColor: theme.colors.primaryLight }]}
                    onPress={() => {
                      setIsModalVisible(false);
                      router.push({
                        pathname: '/chat/[id]',
                        params: { id: selectedCollab.id, name: selectedCollab.name }
                      });
                    }}
                  >
                    <Ionicons name="chatbubble" size={22} color={theme.colors.primary} />
                    <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.quickActionBtn, { backgroundColor: theme.colors.primaryLight }]}
                    onPress={() => {
                      setIsModalVisible(false);
                      router.push({
                        pathname: '/collaborator/files/[id]',
                        params: { id: selectedCollab.id, name: selectedCollab.name }
                      });
                    }}
                  >
                    <Ionicons name="folder" size={22} color={theme.colors.primary} />
                    <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>Archivos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.quickActionBtn, { backgroundColor: theme.colors.primaryLight }]}
                    onPress={() => {
                      setIsModalVisible(false);
                      router.push({
                        pathname: '/collaborator/[id]',
                        params: { id: selectedCollab.id, name: selectedCollab.name }
                      });
                    }}
                  >
                    <Ionicons name="person" size={22} color={theme.colors.primary} />
                    <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>Perfil</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Add Collaborator Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsAddModalVisible(false);
          setFoundCollab(null);
          setIdentityCode('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Agregar Colaborador</Text>
            
            {!foundCollab ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Código de Identidad</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
                    placeholder="Ej. ID-8829"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={identityCode}
                    onChangeText={setIdentityCode}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelBtn, { borderColor: theme.colors.border }]} 
                    onPress={() => setIsAddModalVisible(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmBtn, { backgroundColor: theme.colors.primary }]} 
                    onPress={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmBtnText}>Buscar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Animated.View entering={FadeInDown} style={styles.foundContainer}>
                {!invitationSent ? (
                  <>
                    <View style={[styles.foundAvatar, { backgroundColor: theme.colors.primaryLight }]}>
                      <Text style={[styles.foundAvatarText, { color: theme.colors.primary }]}>
                        {foundCollab.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[styles.foundName, { color: theme.colors.text }]}>{foundCollab.name}</Text>
                    <Text style={[styles.foundRole, { color: theme.colors.textSecondary }]}>{foundCollab.role}</Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={[styles.cancelBtn, { borderColor: theme.colors.border }]} 
                        onPress={() => setFoundCollab(null)}
                      >
                        <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Atrás</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.confirmBtn, { backgroundColor: theme.colors.primary }]} 
                        onPress={handleConfirmAdd}
                      >
                        <Text style={styles.confirmBtnText}>Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.invitationContent}>
                    <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
                      <Ionicons name="mail-unread" size={40} color={theme.colors.success} />
                    </View>
                    <Text style={[styles.invitationTitle, { color: theme.colors.text }]}>¡Solicitud Enviada!</Text>
                    <Text style={[styles.invitationText, { color: theme.colors.textSecondary }]}>
                      Se ha enviado una invitación a {foundCollab.name}. Para comenzar a chatear, esta persona también deberá confirmar que te conoce.
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  searchText: {
    fontSize: 15,
  },
  list: {
    gap: 12,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  name: { fontSize: 17, fontWeight: '700' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  role: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  foundContainer: {
    width: '100%',
    alignItems: 'center',
  },
  foundAvatar: {
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  foundAvatarText: {
    fontSize: 36,
    fontWeight: '800',
  },
  foundName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  foundRole: {
    fontSize: 14,
    marginBottom: 24,
  },
  invitationContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  invitationTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  invitationText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: '800',
  },
  modalName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
