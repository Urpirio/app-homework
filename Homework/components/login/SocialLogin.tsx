import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

/**
 * SocialLogin component
 * 
 * Renders social authentication options (Google, Apple) with a modern design.
 * Includes a divider with "O continuar con" text.
 */
export const SocialLogin = () => {
  const { theme, isDark } = useTheme();

  return (
    <Animated.View 
      entering={FadeInUp.delay(400).duration(600)} 
      style={styles.container}
    >
      <View style={styles.dividerContainer}>
        <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
          O continuar con
        </Text>
        <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
      </View>

      <View style={styles.buttonContainer}>
        <SocialButton 
          icon="logo-google" 
          label="Google" 
          onPress={() => console.log('Google login')} 
        />
      </View>
    </Animated.View>
  );
};

interface SocialButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const SocialButton = ({ icon, label, onPress }: SocialButtonProps) => {
  const { theme, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialButton,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={24} color={theme.colors.text} />
      <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 32,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
});
