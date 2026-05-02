import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect } from 'react';
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
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import api from '@/utils/api';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollaboratorsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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
  const { scannedCode, projectId } = useLocalSearchParams<{ scannedCode?: string; projectId?: string }>();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabAnim = useSharedValue(0);

  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    fabAnim.value = withSpring(toValue, { 
      damping: 20, 
      stiffness: 80,
      mass: 0.8
    });
    setIsFabOpen(!isFabOpen);
  };

  const scanStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabAnim.value },
      { translateY: withSpring(fabAnim.value * -70, { damping: 15, stiffness: 70 }) }
    ],
    opacity: withTiming(fabAnim.value, { duration: 200 }),
  }));

  const manualStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabAnim.value },
      { translateY: withSpring(fabAnim.value * -130, { damping: 18, stiffness: 75 }) }
    ],
    opacity: withTiming(fabAnim.value, { duration: 300 }),
  }));

  const mainFabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(isFabOpen ? '45deg' : '0deg') }]
  }));

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const endpoint = projectId ? `/projects/${projectId}/collaborators` : '/collaborators';
      const collabsRes = await api.get(endpoint);

      // Si es filtrado por proyecto, la estructura de datos podría variar un poco
      // El backend usualmente devuelve una lista de usuarios en este caso
      const data = projectId ? collabsRes.data : collabsRes.data;
      
      const mapped = data.map((c: any) => {
        // Normalizar estructura si viene de /projects/:id/collaborators o /collaborators
        const col = c.collaborator || c;
        return {
          id: col.id,
          collaborationId: c.id,
          name: col.fullName || col.name,
          role: col.role || 'Colaborador',
          avatar: col.avatarUrl,
          status: c.status === 'ACTIVE' || !projectId ? 'active' : 'pending',
        };
      });
      setCollaborators(mapped);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (codeToSearch?: string) => {
    const code = String(codeToSearch || identityCode || '').trim().toUpperCase();
    if (!code) return;
    console.log('[DEBUG] Buscando colaborador con código:', JSON.stringify(code));
    setIsSearching(true);
    
    try {
      const response = await api.get(`/collaborators/search/${encodeURIComponent(code)}`);
      console.log('[DEBUG] Colaborador encontrado:', response.data);
      setFoundCollab({
        id: response.data.id,
        name: response.data.fullName,
        role: response.data.role || 'Colaborador',
        avatar: response.data.avatarUrl,
        status: 'pending'
      });
    } catch (error: any) {
      console.log('[DEBUG] Error buscando colaborador:', error?.response?.status, error?.response?.data);
      Toast.show({
        type: 'error',
        text1: 'No encontrado',
        text2: `No existe un usuario con el código "${code}"`,
        position: 'bottom'
      });
      if (codeToSearch) setIsAddModalVisible(false);
    } finally {
      setIsSearching(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCollaborators();
      
      if (scannedCode) {
        setIdentityCode(scannedCode);
        setIsAddModalVisible(true);
        handleSearch(scannedCode);
      }
    }, [scannedCode, projectId])
  );

  const handleConfirmAdd = async () => {
    if (!foundCollab) return;
    
    try {
      await api.post('/collaborators/request', { identityCode: identityCode.trim() });
      setInvitationSent(true);
      
      // Después de un momento cerramos el modal y refrescamos
      setTimeout(() => {
        setIsAddModalVisible(false);
        setFoundCollab(null);
        setIdentityCode('');
        setInvitationSent(false);
        fetchCollaborators();
      }, 2500);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'No se pudo enviar la solicitud.',
        position: 'bottom'
      });
    }
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
              </View>
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
                {/* Filtro de Proyecto Activo */}
                {projectId && (
                  <Animated.View 
                    entering={FadeInDown}
                    style={[styles.filterBanner, { backgroundColor: theme.colors.primaryLight }]}
                  >
                    <View style={styles.filterInfo}>
                      <Ionicons name="folder-open" size={20} color={theme.colors.primary} />
                      <Text style={[styles.filterText, { color: theme.colors.primary }]}>
                        Filtrado por proyecto
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => router.setParams({ projectId: undefined })}
                      style={styles.clearFilterBtn}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </Animated.View>
                )}

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

        {/* FAB SPEED DIAL */}
        <View style={styles.fabContainer}>
          {/* Botón Nuevo Colaborador */}
          <Animated.View style={[styles.subFab, manualStyle, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity 
              onPress={() => {
                toggleFab();
                setIsAddModalVisible(true);
              }}
              style={styles.subFabInner}
            >
              <Ionicons name="person-add-outline" size={22} color={theme.colors.primary} />
              <View style={[styles.fabLabel, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.fabLabelText, { color: theme.colors.text }]}>Nuevo Colaborador</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Botón Scanner */}
          <Animated.View style={[styles.subFab, scanStyle, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity 
              onPress={() => {
                toggleFab();
                router.push('/collaborator/scanner');
              }}
              style={styles.subFabInner}
            >
              <Ionicons name="qr-code-outline" size={22} color={theme.colors.primary} />
              <View style={[styles.fabLabel, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.fabLabelText, { color: theme.colors.text }]}>Escanear</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Botón Principal */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={toggleFab}
            style={[styles.mainFab, { backgroundColor: theme.colors.primary }]}
          >
            <Animated.View style={mainFabStyle}>
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
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
                    placeholder="Ej. HW-XXXX"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={identityCode}
                    onChangeText={(text) => setIdentityCode(text.toUpperCase().trim())}
                    autoCapitalize="characters"
                    autoCorrect={false}
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
                    onPress={() => handleSearch()}
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
  title: { 
    fontSize: 32, 
    fontWeight: '800',
    letterSpacing: -0.5,
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
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontStyle: 'italic',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  clearFilterBtn: {
    padding: 4,
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
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 25,
    width: 60,
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 999,
  },
  mainFab: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  subFab: {
    position: 'absolute',
    bottom: 5,
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  subFabInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    position: 'absolute',
    right: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    width: '100%',
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 20,
  },
});
