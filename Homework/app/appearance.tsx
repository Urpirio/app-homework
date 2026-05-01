import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

const ACCENT_COLORS = ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500', '#34C759'];

export default function AppearanceScreen() {
  const { theme } = useTheme();

  // State for theme and accent
  const [selectedTheme, setSelectedTheme] = useState('system'); // system, light, dark
  const [accentColor, setAccentColor] = useState(theme.colors.primary);

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: horizontalPadding }}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: theme.colors.text }]}>Apariencia</Text>
              <View style={{ width: 40 }} />
            </View>

            <Animated.View entering={FadeInDown.duration(800)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tema del Sistema</Text>
              <View style={styles.themeGrid}>
                <ThemeOption 
                  id="light" 
                  label="Claro" 
                  selected={selectedTheme === 'light'} 
                  onSelect={setSelectedTheme}
                  icon="sunny-outline"
                />
                <ThemeOption 
                  id="dark" 
                  label="Oscuro" 
                  selected={selectedTheme === 'dark'} 
                  onSelect={setSelectedTheme}
                  icon="moon-outline"
                />
                <ThemeOption 
                  id="system" 
                  label="Sistema" 
                  selected={selectedTheme === 'system'} 
                  onSelect={setSelectedTheme}
                  icon="settings-outline"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Color de Énfasis</Text>
              <View style={styles.accentRow}>
                {ACCENT_COLORS.map((color) => (
                  <Pressable 
                    key={color}
                    onPress={() => setAccentColor(color)}
                    style={[
                      styles.accentOption, 
                      { backgroundColor: color, borderColor: accentColor === color ? theme.colors.text : 'transparent' }
                    ]}
                  >
                    {accentColor === color && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Vista Previa</Text>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.card }]}>
                <View style={[styles.previewHeader, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.previewDot, { backgroundColor: accentColor }]} />
                  <View style={[styles.previewLine, { backgroundColor: theme.colors.border, width: 100 }]} />
                </View>
                <View style={styles.previewContent}>
                  <View style={[styles.previewLine, { backgroundColor: theme.colors.border, width: '80%' }]} />
                  <View style={[styles.previewLine, { backgroundColor: theme.colors.border, width: '60%', marginTop: 8 }]} />
                  <View style={[styles.previewButton, { backgroundColor: accentColor }]}>
                    <View style={[styles.previewLine, { backgroundColor: '#FFFFFF', width: 40, height: 4 }]} />
                  </View>
                </View>
              </View>
              <Text style={[styles.previewHint, { color: theme.colors.textSecondary }]}>
                Los cambios se aplicarán globalmente en toda la aplicación.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const ThemeOption = ({ id, label, selected, onSelect, icon }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={() => onSelect(id)}
      style={[
        styles.themeOption, 
        { 
          backgroundColor: selected ? theme.colors.primaryLight : theme.colors.card,
          borderColor: selected ? theme.colors.primary : 'transparent'
        }
      ]}
    >
      <Ionicons name={icon} size={24} color={selected ? theme.colors.primary : theme.colors.textSecondary} />
      <Text style={[styles.themeLabel, { color: selected ? theme.colors.primary : theme.colors.text }]}>{label}</Text>
      {selected && (
        <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  accentOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCard: {
    padding: 20,
    borderRadius: 24,
    minHeight: 150,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 16,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
  },
  previewContent: {
    gap: 4,
  },
  previewButton: {
    marginTop: 16,
    height: 32,
    borderRadius: 10,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHint: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
