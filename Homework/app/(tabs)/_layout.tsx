import { useCalendarBadge } from '@/hooks/useCalendarBadge';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import {
  handleInitialNotification,
  removeNotificationResponseListener,
  setupNotificationResponseListener,
} from '@/utils/notificationHandler';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const [role, setRole] = useState<string | null>(null);
  const { isTabVisible } = useRouteGuard(role);
  const { count: notificationBadge } = useNotificationBadge();
  const calendarBadge = useCalendarBadge();

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (isMounted) setRole(res.data.role);
      } catch (error) {
        console.error('Error fetching role for tabs:', error);
      }
    };
    fetchRole();
    return () => { isMounted = false; };
  }, []);

  // Set up background notification tap handling
  useEffect(() => {
    setupNotificationResponseListener();
    handleInitialNotification();
    return () => {
      removeNotificationResponseListener();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.colors.background,
        },
        tabBarBackground: () => 
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 10,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 0 : 5,
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: role === 'SUPPORT' ? 'Soporte' : 'Inicio',
          tabBarBadge: notificationBadge > 0 ? notificationBadge : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={role === 'SUPPORT'
                ? (focused ? 'headset' : 'headset-outline')
                : (focused ? 'home' : 'home-outline')}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarBadge: calendarBadge > 0 ? calendarBadge : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collaborators"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Admin',
          href: isTabVisible('admin-dashboard') ? '/admin-dashboard' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'stats-chart' : 'stats-chart-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
