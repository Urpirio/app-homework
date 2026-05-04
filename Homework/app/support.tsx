import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import api from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

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
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'TECNICO' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      Toast.show({ type: 'error', text1: 'Campos incompletos' });
      return;
    }
    try {
      await api.post('/tickets', newTicket);
      Toast.show({ type: 'success', text1: 'Ticket creado correctamente' });
      setShowNewTicket(false);
      setNewTicket({ subject: '', description: '', category: 'TECNICO' });
      fetchTickets();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error al crear ticket' });
    }
  };

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@homeworkapp.com?subject=Soporte Técnico');
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
                  icon="add-circle-outline" 
                  label="Nuevo Ticket" 
                  description="Reportar problema"
                  color={theme.colors.primary}
                  onPress={() => router.push('/support/create-ticket')}
                />
                <ContactCard 
                  icon="mail-outline" 
                  label="Correo" 
                  description="Soporte técnico"
                  color={theme.colors.secondary}
                  onPress={handleEmail}
                />
              </View>
            </Animated.View>

            {showNewTicket && (
              <Animated.View entering={FadeInDown} style={[styles.newTicketForm, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.formTitle, { color: theme.colors.text }]}>Crear Ticket de Soporte</Text>
                <TextInput 
                  placeholder="Asunto"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={newTicket.subject}
                  onChangeText={(text) => setNewTicket({...newTicket, subject: text})}
                />
                <TextInput 
                  placeholder="Descripción detallada del problema..."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  multiline
                  numberOfLines={4}
                  value={newTicket.description}
                  onChangeText={(text) => setNewTicket({...newTicket, description: text})}
                />
                <Pressable 
                  onPress={handleCreateTicket}
                  style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles.submitBtnText}>Enviar Ticket</Text>
                </Pressable>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mis Tickets</Text>
              {loading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : tickets.length === 0 ? (
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>No tienes tickets activos.</Text>
              ) : (
                tickets.map((ticket) => (
                  <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.ticketHeader}>
                      <Text style={[styles.ticketSubject, { color: theme.colors.text }]}>{ticket.subject}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: ticket.status === 'OPEN' ? theme.colors.success + '20' : theme.colors.border }]}>
                        <Text style={[styles.statusText, { color: ticket.status === 'OPEN' ? theme.colors.success : theme.colors.textSecondary }]}>{ticket.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.ticketDate, { color: theme.colors.textSecondary }]}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
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
  newTicketForm: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '800',
  },
  ticketCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ticketDate: {
    fontSize: 11,
  },
});
