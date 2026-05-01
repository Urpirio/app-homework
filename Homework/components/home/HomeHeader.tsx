import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View, Pressable } from 'react-native';

export const HomeHeader = () => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable 
        onPress={() => router.push('/profile')}
        style={styles.userInfo}
      >
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>JD</Text>
        </View>
        <View style={styles.welcomeText}>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Hola,</Text>
          <Text style={[styles.userName, { color: theme.colors.text }]}>John Doe</Text>
        </View>
      </Pressable>
      
      <Pressable 
        onPress={() => router.push('/notifications')}
        style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
      >
        <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  welcomeText: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
