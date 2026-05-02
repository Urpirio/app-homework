import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import { UserRole } from '@/types/auth';

export default function TabLayout() {
  const { theme } = useTheme();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await api.get('/auth/profile');
        setRole(res.data.role);
      } catch (error) {
        console.error('Error fetching role for tabs:', error);
      }
    };
    fetchRole();
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
            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={theme.dark ? 'dark' : 'light'} />
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
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collaborators"
        options={{
          title: 'Colaboradores',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      {(role === UserRole.SCHOOL_ADMIN || role === UserRole.SUPER_ADMIN) && (
        <Tabs.Screen
          name="admin/index"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? 'stats-chart' : 'stats-chart-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
