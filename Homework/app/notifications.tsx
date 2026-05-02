import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'project' | 'task' | 'alert';
  read: boolean;
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'requests'>('general');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notifsRes, pendingRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/collaborators/pending')
      ]);
      setNotifications(notifsRes.data);
      setPendingRequests(pendingRes.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.patch(`/collaborators/${requestId}/accept`);
      Toast.show({ type: 'success', text1: '¡Aceptado!', text2: 'Ahora puedes colaborar.', position: 'top' });
      fetchNotifications();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo aceptar.' });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.patch(`/collaborators/${requestId}/reject`);
      fetchNotifications();
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markRead = async (notification: any) => {
    try {
      if (!notification.read) {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
      }

      // Lógica de navegación inteligente
      if (notification.type === 'collaborator_accepted') {
        // Si aceptaron, ir al chat (necesitamos el ID del colaborador que está en el mensaje o metadata)
        // Por ahora, como no tenemos metadata específica, vamos a la lista de colaboradores
        router.push('/(tabs)/collaborators');
      } else if (notification.type === 'collaborator_request') {
        // Si es una solicitud nueva, cambiar a la pestaña de solicitudes
        setActiveTab('requests');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const grouped = notifications.reduce((acc: any, n: any) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let section = 'Anteriores';
    if (date.toDateString() === today.toDateString()) section = 'Hoy';
    else if (date.toDateString() === yesterday.toDateString()) section = 'Ayer';

    if (!acc[section]) acc[section] = [];
    acc[section].push({
      ...n,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: n.type.toLowerCase()
    });
    return acc;
  }, {});

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={{ flex: 1, paddingHorizontal: horizontalPadding }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.colors.text }]}>Notificaciones</Text>
            <Pressable onPress={markAllRead}>
              <Text style={[styles.markAll, { color: theme.colors.primary }]}>Leídas</Text>
            </Pressable>
          </View>

          {/* Tabs Selector */}
          <View style={[styles.tabsContainer, { backgroundColor: theme.colors.card }]}>
            <Pressable 
              onPress={() => setActiveTab('general')}
              style={[styles.tab, activeTab === 'general' && { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'general' ? '#FFFFFF' : theme.colors.textSecondary }]}>
                General {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`}
              </Text>
            </Pressable>
            <Pressable 
              onPress={() => setActiveTab('requests')}
              style={[styles.tab, activeTab === 'requests' && { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'requests' ? '#FFFFFF' : theme.colors.textSecondary }]}>
                Solicitudes {pendingRequests.length > 0 && `(${pendingRequests.length})`}
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : activeTab === 'general' ? (
              Object.keys(grouped).length > 0 ? (
                Object.entries(grouped).map(([section, items]: [string, any], sectionIndex) => (
                  <View key={section} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{section}</Text>
                    {items.map((item: any, index: number) => (
                      <NotificationItem 
                        key={item.id} 
                        notification={item} 
                        index={index + sectionIndex * 2} 
                        onPress={() => markRead(item)}
                      />
                    ))}
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No tienes notificaciones por ahora.
                </Text>
              )
            ) : (
              <View style={styles.requestsList}>
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request, index) => (
                    <RequestItem 
                      key={request.id}
                      request={request}
                      index={index}
                      onAccept={() => handleAcceptRequest(request.id)}
                      onReject={() => handleRejectRequest(request.id)}
                    />
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No hay solicitudes de colaboración pendientes.
                  </Text>
                )}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const NotificationItem = ({ 
  notification, 
  index, 
  onPress 
}: { 
  notification: Notification, 
  index: number,
  onPress: () => void 
}) => {
  const { theme } = useTheme();

  const getIcon = () => {
    switch (notification.type) {
      case 'project': return { name: 'folder-outline', color: theme.colors.primary };
      case 'task': return { name: 'list-outline', color: theme.colors.success };
      case 'alert': return { name: 'alert-circle-outline', color: '#FF9500' };
      case 'collaborator_accepted': return { name: 'person-add-outline', color: theme.colors.primary };
      case 'collaborator_request': return { name: 'mail-outline', color: theme.colors.primary };
      default: return { name: 'notifications-outline', color: theme.colors.textSecondary };
    }
  };

  const icon = getIcon();

  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.itemContainer}>
      <Pressable 
        onPress={onPress}
        style={[styles.itemContent, { backgroundColor: theme.colors.card }]}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name as any} size={22} color={icon.color} />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{notification.title}</Text>
            {!notification.read && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
          </View>
          <Text style={[styles.itemMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={[styles.itemTime, { color: theme.colors.textSecondary }]}>{notification.time}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const RequestItem = ({ request, index, onAccept, onReject }: any) => {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.itemContainer}>
      <View style={[styles.itemContent, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
          {request.collaborator.avatarUrl ? (
            <Image source={{ uri: request.collaborator.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarTextSmall, { color: theme.colors.primary }]}>
              {request.collaborator.fullName.charAt(0)}
            </Text>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{request.collaborator.fullName}</Text>
          <Text style={[styles.itemMessage, { color: theme.colors.textSecondary }]}>
            Quiere agregarte como colaborador para trabajar en proyectos juntos.
          </Text>
          <View style={styles.requestActions}>
            <Pressable 
              onPress={onReject}
              style={[styles.actionButton, styles.rejectBtn, { borderColor: theme.colors.error }]}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>Rechazar</Text>
            </Pressable>
            <Pressable 
              onPress={onAccept}
              style={[styles.actionButton, styles.acceptBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Aceptar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', flex: 1, marginLeft: 8 },
  markAll: { fontSize: 14, fontWeight: '700' },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 16,
    marginBottom: 24,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  requestsList: {
    gap: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  avatarTextSmall: {
    fontSize: 18,
    fontWeight: '800',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    borderWidth: 1,
  },
  acceptBtn: {
    // bg set in component
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
