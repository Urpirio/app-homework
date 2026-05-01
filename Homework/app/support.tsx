import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FAQS = [
  {
    question: '¿Cómo creo un nuevo proyecto?',
    answer: 'Puedes crear un proyecto desde la pantalla principal pulsando el botón "+" en la sección de proyectos o desde el listado completo de proyectos.'
  },
  {
    question: '¿Puedo editar una tarea finalizada?',
    answer: 'Sí, simplemente pulsa sobre la tarea en cualquier momento para abrir el editor y realizar los cambios necesarios.'
  },
  {
    question: '¿Cómo cambio el tema de la app?',
    answer: 'Ve a tu Perfil > Apariencia. Allí podrás elegir entre modo claro, oscuro o automático según tu sistema.'
  },
];

export default function SupportScreen() {
  const { theme } = useTheme();

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@homeworkapp.com?subject=Soporte Técnico');
  };

  const handleChat = () => {
    Alert.alert('Información', 'La función de Chat en vivo no está disponible en este momento.');
  };

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
              <Text style={[styles.title, { color: theme.colors.text }]}>Ayuda y Soporte</Text>
              <View style={{ width: 40 }} />
            </View>

            <Animated.View entering={FadeInDown.duration(800)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contacto Directo</Text>
              <View style={styles.contactGrid}>
                <ContactCard 
                  icon="chatbubble-ellipses-outline" 
                  label="Chat en vivo" 
                  description="Respuesta inmediata"
                  color="#34C759"
                  onPress={handleChat}
                />
                <ContactCard 
                  icon="mail-outline" 
                  label="Correo" 
                  description="Soporte técnico"
                  color={theme.colors.primary}
                  onPress={handleEmail}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preguntas Frecuentes</Text>
              {FAQS.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>
              <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
                Versión 1.0.0 (Build 20240501)
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const ContactCard = ({ icon, label, description, color, onPress }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={[styles.contactCard, { backgroundColor: theme.colors.card }]}
    >
      <View style={[styles.contactIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.contactLabel, { color: theme.colors.text }]}>{label}</Text>
      <Text style={[styles.contactDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
    </Pressable>
  );
};

const FAQItem = ({ question, answer }: any) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable 
      onPress={() => setExpanded(!expanded)}
      style={[styles.faqItem, { backgroundColor: theme.colors.card }]}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{question}</Text>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.colors.textSecondary} 
        />
      </View>
      {expanded && (
        <Animated.View layout={Layout.springify()} style={styles.faqBody}>
          <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>{answer}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
};

const SocialIcon = ({ name }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable style={[styles.socialIcon, { backgroundColor: theme.colors.card }]}>
      <Ionicons name={name} size={20} color={theme.colors.text} />
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
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  faqItem: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  faqBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  versionText: {
    fontSize: 12,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
