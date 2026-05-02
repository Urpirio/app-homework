import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { ActivityIndicator } from 'react-native';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
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
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
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

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([section, items]: [string, any], sectionIndex) => (
                <View key={section} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{section}</Text>
                  {items.map((item: any, index: number) => (
                    <NotificationItem 
                      key={item.id} 
                      notification={item} 
                      index={index + sectionIndex * 2} 
                      onPress={() => markRead(item.id)}
                    />
                  ))}
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
                No tienes notificaciones por ahora.
              </Text>
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
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
