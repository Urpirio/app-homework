/**
 * Ticket Detail Screen
 *
 * Displays full ticket details with status timeline, participants,
 * status transition actions, and escalation workflow.
 *
 * Validates: Requirements 15.4, 15.5, 15.6, 15.7
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState, SkeletonLoader } from '@/components/shared';
import { ThemedView } from '@/components/shared/ThemedView';
import { useProfile } from '@/hooks/api/useAuth';
import { useTicketDetail, useUpdateTicket } from '@/hooks/api/useTickets';
import { useTheme } from '@/hooks/useTheme';
import type { TicketStatus } from '@/types/ticket';
import {
    getTransitionActionLabel,
    getValidTransitions,
    shouldAutoEscalate,
} from '@/utils/ticketEscalation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#007AFF',
  IN_PROGRESS: '#FF9500',
  RESOLVED: '#34C759',
  CLOSED: '#8E8E93',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

export default function TicketDetailScreen() {
  const { id, ticketId } = useLocalSearchParams<{ id: string; ticketId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const updateTicket = useUpdateTicket();
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationNote, setEscalationNote] = useState('');

  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useTicketDetail(ticketId!);

  const handleStatusTransition = (targetStatus: TicketStatus) => {
    const label = getTransitionActionLabel(targetStatus);
    Alert.alert(
      'Confirmar Acción',
      `¿Deseas cambiar el estado a "${label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await updateTicket.mutateAsync({
                ticketId: ticketId!,
                payload: {
                  status: targetStatus,
                  ...(targetStatus === 'IN_PROGRESS' && profile?.id
                    ? { assignedToId: profile.id }
                    : {}),
                },
              });
              Toast.show({ type: 'success', text1: `Estado actualizado a ${label}` });
            } catch {
              Toast.show({ type: 'error', text1: 'Error al actualizar estado' });
            }
          },
        },
      ]
    );
  };

  const handleEscalate = async () => {
    if (!escalationNote.trim()) {
      Toast.show({ type: 'error', text1: 'Agrega una nota de escalación' });
      return;
    }
    try {
      await updateTicket.mutateAsync({
        ticketId: ticketId!,
        payload: { escalationNote: escalationNote.trim() },
      });
      Toast.show({ type: 'success', text1: 'Ticket escalado exitosamente' });
      setShowEscalation(false);
      setEscalationNote('');
    } catch {
      Toast.show({ type: 'error', text1: 'Error al escalar ticket' });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Detalle del Ticket
            </Text>
          </View>
          <View style={{ padding: 20 }}>
            <SkeletonLoader rows={4} variant="detail" />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (isError || !ticket) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Detalle del Ticket
            </Text>
          </View>
          <ErrorState error={error as any} onRetry={() => refetch()} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[ticket.status] || '#8E8E93';
  const validTransitions = getValidTransitions(ticket.status);
  const isEscalatable =
    ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS';
  const isAutoEscalated = shouldAutoEscalate({
    status: ticket.status,
    priority: (ticket as any).priority,
    createdAt: ticket.createdAt,
    assignedToId: ticket.assignedToId,
  });
  const isSupportStaff = profile?.role === 'SUPPORT' || profile?.role === 'SUPER_ADMIN' || profile?.role === 'SCHOOL_ADMIN';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Detalle del Ticket
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Auto-escalation warning */}
          {isAutoEscalated && (
            <View style={[styles.escalationBanner, { backgroundColor: '#FF3B3015' }]}>
              <Ionicons name="warning" size={18} color="#FF3B30" />
              <Text style={styles.escalationBannerText}>
                Este ticket requiere atención urgente (auto-escalado)
              </Text>
            </View>
          )}

          {/* Status and Category Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.dot, { backgroundColor: statusColor }]} />
              <Text style={[styles.badgeText, { color: statusColor }]}>
                {STATUS_LABELS[ticket.status]}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {ticket.category}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>{ticket.title}</Text>

          {/* Description */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '30' },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              Descripción del Problema
            </Text>
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {ticket.description}
            </Text>
          </View>

          {/* Timeline */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '30' },
            ]}
          >
            <Text
              style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginBottom: 15 }]}
            >
              Cronología
            </Text>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: theme.colors.textSecondary }]}>
                  Creado
                </Text>
                <Text style={[styles.timelineValue, { color: theme.colors.text }]}>
                  {new Date(ticket.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
            {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
              <View style={[styles.timelineItem, { marginBottom: 0 }]}>
                <View style={[styles.timelineDot, { backgroundColor: '#34C759' }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, { color: theme.colors.textSecondary }]}>
                    {ticket.status === 'CLOSED' ? 'Cerrado' : 'Resuelto'}
                  </Text>
                  <Text style={[styles.timelineValue, { color: theme.colors.text }]}>
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Review link if ticket has a review */}
          {ticket.review && (
            <View
              style={[styles.card, { backgroundColor: '#FFCC0010', borderColor: '#FFCC0030' }]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="star" size={20} color="#FFCC00" />
                <Text style={[styles.sectionLabel, { color: '#FF9500', marginLeft: 8 }]}>
                  Reseña del Servicio
                </Text>
              </View>
              <Text style={[styles.description, { color: theme.colors.text }]}>
                Calificación: {ticket.review.rating}/5
                {ticket.review.comment ? `\n${ticket.review.comment}` : ''}
              </Text>
            </View>
          )}

          {/* Status Transition Actions (for support staff) */}
          {isSupportStaff && validTransitions.length > 0 && (
            <View style={styles.actionsSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                Acciones
              </Text>
              <View style={styles.actionsRow}>
                {validTransitions.map((targetStatus) => {
                  const targetColor = STATUS_COLORS[targetStatus];
                  return (
                    <Pressable
                      key={targetStatus}
                      onPress={() => handleStatusTransition(targetStatus)}
                      disabled={updateTicket.isPending}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        {
                          backgroundColor: targetColor + '15',
                          borderColor: targetColor + '40',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.actionBtnText, { color: targetColor }]}>
                        {getTransitionActionLabel(targetStatus)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Manual Escalation (for support staff) */}
          {isSupportStaff && isEscalatable && (
            <View style={styles.actionsSection}>
              {!showEscalation ? (
                <Pressable
                  onPress={() => setShowEscalation(true)}
                  style={({ pressed }) => [
                    styles.escalateBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="arrow-up-circle-outline" size={18} color="#FF3B30" />
                  <Text style={styles.escalateBtnText}>Escalar Ticket</Text>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.escalationForm,
                    { backgroundColor: theme.colors.card, borderColor: '#FF3B3040' },
                  ]}
                >
                  <Text style={[styles.sectionLabel, { color: '#FF3B30' }]}>
                    Nota de Escalación
                  </Text>
                  <TextInput
                    style={[
                      styles.escalationInput,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.border + '40',
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    placeholder="Describe el motivo de la escalación..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={escalationNote}
                    onChangeText={setEscalationNote}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={styles.escalationActions}>
                    <Pressable
                      onPress={() => {
                        setShowEscalation(false);
                        setEscalationNote('');
                      }}
                      style={[styles.escalationCancelBtn, { borderColor: theme.colors.border }]}
                    >
                      <Text style={[styles.escalationCancelText, { color: theme.colors.textSecondary }]}>
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleEscalate}
                      disabled={updateTicket.isPending}
                      style={[styles.escalationConfirmBtn, { backgroundColor: '#FF3B30' }]}
                    >
                      <Text style={styles.escalationConfirmText}>Escalar</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Tracking ID */}
          <View
            style={[styles.trackingCard, { backgroundColor: theme.colors.primary + '10' }]}
          >
            <Ionicons name="barcode-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.trackingText, { color: theme.colors.text }]}>
              ID: #{ticket.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  escalationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
  },
  escalationBannerText: { color: '#FF3B30', fontSize: 13, fontWeight: '700', flex: 1 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 25 },
  card: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  description: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 15 },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 11, fontWeight: '700' },
  timelineValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  trackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    marginTop: 8,
  },
  trackingText: { fontSize: 14, fontWeight: '700' },
  actionsSection: { marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontWeight: '800' },
  escalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  escalateBtnText: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
  escalationForm: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  escalationInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 12,
  },
  escalationActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  escalationCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  escalationCancelText: { fontSize: 13, fontWeight: '700' },
  escalationConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  escalationConfirmText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
