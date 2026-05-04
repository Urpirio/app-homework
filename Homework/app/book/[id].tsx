/**
 * Book Detail Screen
 *
 * Displays comprehensive book information from GET /library/books/{id},
 * supports loan requests via POST /library/books/{id}/loan with confirmation,
 * and book returns via PATCH /loans/{id}/return with status update.
 * Shows active loans, loan history, and overdue indicators.
 * Handles unavailability with expected return date message.
 *
 * Validates: Requirements 18.5, 18.6, 18.7, 18.8, 18.9
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useBookDetail, useLoanBook, useReturnBook } from '@/hooks/api/useLibrary';
import { useTheme } from '@/hooks/useTheme';
import type { BookLoan } from '@/types/library';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Category-based visual mapping for book covers */
const CATEGORY_VISUALS: Record<string, { icon: string; color: string }> = {
  Literatura: { icon: 'book-outline', color: '#FF9500' },
  Ciencia: { icon: 'flask-outline', color: '#007AFF' },
  Historia: { icon: 'library-outline', color: '#34C759' },
  Arte: { icon: 'color-palette-outline', color: '#FF2D55' },
  Matemáticas: { icon: 'calculator-outline', color: '#AF52DE' },
  Tecnología: { icon: 'hardware-chip-outline', color: '#5AC8FA' },
};
const DEFAULT_VISUAL = { icon: 'book-outline', color: '#5856D6' };

function getBookVisual(categoryName?: string) {
  return (categoryName && CATEGORY_VISUALS[categoryName]) || DEFAULT_VISUAL;
}

/** Format a date string to a readable locale date */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Check if a loan is overdue (active with no return date and loan date > 14 days ago) */
function isLoanOverdue(loan: BookLoan): boolean {
  return loan.status === 'OVERDUE';
}

/** Estimate expected return date (14 days from loan date) */
function getExpectedReturnDate(loan: BookLoan): string {
  try {
    const loanDate = new Date(loan.loanDate);
    const expectedReturn = new Date(loanDate);
    expectedReturn.setDate(expectedReturn.getDate() + 14);
    return formatDate(expectedReturn.toISOString());
  } catch {
    return 'Fecha no disponible';
  }
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [loanActionInProgress, setLoanActionInProgress] = useState(false);

  const bookId = id ?? '';

  const {
    data: book,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookDetail(bookId);

  const loanMutation = useLoanBook();
  const returnMutation = useReturnBook();

  // Derive loan information from book data
  const activeLoan = useMemo(() => {
    if (!book?.loans) return null;
    return book.loans.find(
      (loan) => loan.status === 'ACTIVE' || loan.status === 'OVERDUE'
    ) ?? null;
  }, [book?.loans]);

  const loanHistory = useMemo(() => {
    if (!book?.loans) return [];
    return book.loans
      .filter((loan) => loan.status === 'RETURNED')
      .sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
  }, [book?.loans]);

  const categoryName = typeof book?.category === 'object' ? book?.category?.name : undefined;
  const visual = getBookVisual(categoryName);

  // Loan request with confirmation dialog
  const handleLoanRequest = useCallback(() => {
    Alert.alert(
      'Solicitar Préstamo',
      `¿Deseas solicitar el préstamo de "${book?.title}"? Tendrás 14 días para devolverlo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoanActionInProgress(true);
            try {
              await loanMutation.mutateAsync(bookId);
              Alert.alert(
                'Préstamo Confirmado',
                `Has solicitado "${book?.title}". Recuerda devolverlo en 14 días.`
              );
            } catch (err: any) {
              const message =
                err?.response?.data?.message ||
                'No se pudo procesar el préstamo. Intenta de nuevo.';
              Alert.alert('Error', message);
            } finally {
              setLoanActionInProgress(false);
            }
          },
        },
      ]
    );
  }, [book?.title, bookId, loanMutation]);

  // Return book with confirmation dialog
  const handleReturnBook = useCallback(() => {
    if (!activeLoan) return;

    Alert.alert(
      'Devolver Libro',
      `¿Confirmas la devolución de "${book?.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Devolver',
          onPress: async () => {
            setLoanActionInProgress(true);
            try {
              await returnMutation.mutateAsync(activeLoan.id);
              Alert.alert(
                'Devolución Exitosa',
                `"${book?.title}" ha sido devuelto correctamente.`
              );
            } catch (err: any) {
              const message =
                err?.response?.data?.message ||
                'No se pudo procesar la devolución. Intenta de nuevo.';
              Alert.alert('Error', message);
            } finally {
              setLoanActionInProgress(false);
            }
          },
        },
      ]
    );
  }, [activeLoan, book?.title, returnMutation]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          <SkeletonLoader rows={4} variant="detail" style={{ paddingHorizontal: 25 }} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !book) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={styles.container}>
          <BackgroundShapes />
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          {error ? (
            <ErrorState
              error={error}
              onRetry={() => refetch()}
              onBack={() => router.back()}
            />
          ) : (
            <ErrorState
              error={{ category: 'unknown', userMessage: 'No se encontró el libro.', retryable: true, action: 'back' }}
              onBack={() => router.back()}
            />
          )}
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header with back button and availability badge */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: book.available
                    ? theme.colors.success + '15'
                    : activeLoan && isLoanOverdue(activeLoan)
                      ? '#FF3B3015'
                      : '#FF950015',
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: book.available
                      ? theme.colors.success
                      : activeLoan && isLoanOverdue(activeLoan)
                        ? '#FF3B30'
                        : '#FF9500',
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: book.available
                      ? theme.colors.success
                      : activeLoan && isLoanOverdue(activeLoan)
                        ? '#FF3B30'
                        : '#FF9500',
                  },
                ]}
              >
                {book.available
                  ? 'Disponible'
                  : activeLoan && isLoanOverdue(activeLoan)
                    ? 'Vencido'
                    : 'Prestado'}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            {/* Book Cover */}
            <Animated.View entering={FadeInUp.duration(600)} style={styles.coverArea}>
              <View style={[styles.bookCover, { backgroundColor: visual.color + '15' }]}>
                <Ionicons name={visual.icon as any} size={100} color={visual.color} />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)} style={styles.infoArea}>
              {/* Title and Author */}
              <Text style={[styles.title, { color: theme.colors.text }]}>{book.title}</Text>
              <Text style={[styles.author, { color: theme.colors.textSecondary }]}>{book.author}</Text>

              {/* Metadata Row */}
              <View style={styles.metaRow}>
                {categoryName && (
                  <View style={[styles.metaItem, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Categoría</Text>
                    <Text style={[styles.metaValue, { color: theme.colors.text }]}>{categoryName}</Text>
                  </View>
                )}
                {book.available !== undefined && (
                  <View style={[styles.metaItem, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Estado</Text>
                    <Text style={[styles.metaValue, { color: book.available ? theme.colors.success : '#FF9500' }]}>
                      {book.available ? 'Disponible' : 'En préstamo'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Synopsis */}
              {book.synopsis && (
                <View style={[styles.descriptionBox, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sinopsis</Text>
                  <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
                    {book.synopsis}
                  </Text>
                </View>
              )}

              {/* Location */}
              {book.location && (
                <View style={[styles.locationCard, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
                  <View style={styles.locationInfo}>
                    <Text style={[styles.locationLabel, { color: theme.colors.primary }]}>Ubicación en Biblioteca</Text>
                    <Text style={[styles.locationValue, { color: theme.colors.primary }]}>{book.location}</Text>
                  </View>
                </View>
              )}

              {/* Unavailability Notice with Expected Return Date (Req 18.9) */}
              {!book.available && activeLoan && (
                <View style={[styles.unavailableCard, { backgroundColor: '#FF950010' }]}>
                  <Ionicons
                    name={isLoanOverdue(activeLoan) ? 'warning-outline' : 'time-outline'}
                    size={24}
                    color={isLoanOverdue(activeLoan) ? '#FF3B30' : '#FF9500'}
                  />
                  <View style={styles.unavailableInfo}>
                    <Text style={[styles.unavailableTitle, { color: isLoanOverdue(activeLoan) ? '#FF3B30' : '#FF9500' }]}>
                      {isLoanOverdue(activeLoan)
                        ? 'Préstamo Vencido'
                        : 'Libro No Disponible'}
                    </Text>
                    <Text style={[styles.unavailableText, { color: theme.colors.textSecondary }]}>
                      {isLoanOverdue(activeLoan)
                        ? `La fecha de devolución esperada era ${getExpectedReturnDate(activeLoan)}`
                        : `Fecha estimada de devolución: ${getExpectedReturnDate(activeLoan)}`}
                    </Text>
                  </View>
                </View>
              )}

              {/* Active Loan Section (Req 18.8) */}
              {activeLoan && (
                <View style={[styles.loanSection, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.loanSectionHeader}>
                    <Ionicons name="bookmark" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Préstamo Activo</Text>
                    {isLoanOverdue(activeLoan) && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueBadgeText}>VENCIDO</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.loanDetail}>
                    <Text style={[styles.loanDetailLabel, { color: theme.colors.textSecondary }]}>Fecha de préstamo</Text>
                    <Text style={[styles.loanDetailValue, { color: theme.colors.text }]}>{formatDate(activeLoan.loanDate)}</Text>
                  </View>
                  <View style={styles.loanDetail}>
                    <Text style={[styles.loanDetailLabel, { color: theme.colors.textSecondary }]}>Devolución esperada</Text>
                    <Text
                      style={[
                        styles.loanDetailValue,
                        { color: isLoanOverdue(activeLoan) ? '#FF3B30' : theme.colors.text },
                      ]}
                    >
                      {getExpectedReturnDate(activeLoan)}
                    </Text>
                  </View>
                  <View style={styles.loanDetail}>
                    <Text style={[styles.loanDetailLabel, { color: theme.colors.textSecondary }]}>Estado</Text>
                    <Text
                      style={[
                        styles.loanDetailValue,
                        { color: isLoanOverdue(activeLoan) ? '#FF3B30' : '#FF9500' },
                      ]}
                    >
                      {isLoanOverdue(activeLoan) ? 'Vencido' : 'Activo'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Loan History Section (Req 18.8) */}
              {loanHistory.length > 0 && (
                <View style={[styles.loanSection, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.loanSectionHeader}>
                    <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Historial de Préstamos</Text>
                  </View>
                  {loanHistory.map((loan) => (
                    <View key={loan.id} style={styles.historyItem}>
                      <View style={styles.historyDot} />
                      <View style={styles.historyContent}>
                        <Text style={[styles.historyDate, { color: theme.colors.text }]}>
                          {formatDate(loan.loanDate)}
                          {loan.returnDate ? ` — ${formatDate(loan.returnDate)}` : ''}
                        </Text>
                        <Text style={[styles.historyStatus, { color: theme.colors.success }]}>Devuelto</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionArea}>
                {book.available ? (
                  // Loan button (Req 18.6)
                  <Pressable
                    onPress={handleLoanRequest}
                    disabled={loanActionInProgress || loanMutation.isPending}
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.colors.primary },
                      (loanActionInProgress || loanMutation.isPending) && styles.actionButtonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Solicitar préstamo"
                  >
                    <Ionicons name="book-outline" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>
                      {loanActionInProgress || loanMutation.isPending
                        ? 'Procesando...'
                        : 'Solicitar Préstamo'}
                    </Text>
                  </Pressable>
                ) : activeLoan ? (
                  // Return button (Req 18.7)
                  <Pressable
                    onPress={handleReturnBook}
                    disabled={loanActionInProgress || returnMutation.isPending}
                    style={[
                      styles.actionButton,
                      { backgroundColor: '#FF9500' },
                      (loanActionInProgress || returnMutation.isPending) && styles.actionButtonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Devolver libro"
                  >
                    <Ionicons name="return-down-back-outline" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>
                      {loanActionInProgress || returnMutation.isPending
                        ? 'Procesando...'
                        : 'Devolver Libro'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Info notice */}
              <View style={styles.noticeBox}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
                  {book.available
                    ? 'También puedes acudir al mostrador de la biblioteca para solicitar este ejemplar.'
                    : 'Contacta a la biblioteca si necesitas más información sobre la disponibilidad.'}
                </Text>
              </View>
            </Animated.View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  content: { paddingHorizontal: 25 },
  coverArea: { alignItems: 'center', marginVertical: 30 },
  bookCover: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoArea: { gap: 15 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 32 },
  author: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaItem: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center' },
  metaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '800' },
  descriptionBox: { padding: 20, borderRadius: 24, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  descriptionText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    gap: 15,
  },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 12, fontWeight: '800', opacity: 0.8 },
  locationValue: { fontSize: 16, fontWeight: '900' },
  unavailableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  unavailableInfo: { flex: 1 },
  unavailableTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  unavailableText: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  loanSection: { padding: 20, borderRadius: 24, gap: 12 },
  loanSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overdueBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  overdueBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  loanDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  loanDetailLabel: { fontSize: 13, fontWeight: '600' },
  loanDetailValue: { fontSize: 13, fontWeight: '800' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  historyContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: { fontSize: 13, fontWeight: '600' },
  historyStatus: { fontSize: 12, fontWeight: '700' },
  actionArea: { marginTop: 5 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    marginTop: 10,
  },
  noticeText: { fontSize: 12, fontWeight: '500', flex: 1 },
});
