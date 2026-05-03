import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_BOOKS_DETAILS: Record<string, any> = {
  '1': { 
    title: 'Don Quijote de la Mancha', 
    author: 'Miguel de Cervantes', 
    category: 'Literatura', 
    available: true, 
    color: '#FF9500',
    year: '1605',
    editorial: 'Real Academia',
    location: 'Pasillo 1, Estantería A-4',
    description: 'Narra las aventuras de Alonso Quijano, un hidalgo que, tras leer demasiados libros de caballerías, decide convertirse en caballero andante para deshacer entuertos y proteger a los desvalidos.'
  },
  '2': { 
    title: 'Cien Años de Soledad', 
    author: 'Gabriel García Márquez', 
    category: 'Literatura', 
    available: false, 
    color: '#5856D6',
    year: '1967',
    editorial: 'Sudamericana',
    location: 'Pasillo 1, Estantería C-2',
    description: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo. Una obra maestra del realismo mágico.'
  },
  '3': { 
    title: 'Breve Historia del Tiempo', 
    author: 'Stephen Hawking', 
    category: 'Ciencia', 
    available: true, 
    color: '#007AFF',
    year: '1988',
    editorial: 'Bantam Books',
    location: 'Pasillo 4, Estantería D-1',
    description: 'Un viaje a través de los conceptos más complejos de la cosmología, desde el Big Bang hasta los agujeros negros, explicado para el público general.'
  }
};

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

  const book = MOCK_BOOKS_DETAILS[id as string] || MOCK_BOOKS_DETAILS['1'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={[styles.statusBadge, { backgroundColor: book.available ? theme.colors.success + '15' : '#FF3B3015' }]}>
              <View style={[styles.statusDot, { backgroundColor: book.available ? theme.colors.success : '#FF3B30' }]} />
              <Text style={[styles.statusText, { color: book.available ? theme.colors.success : '#FF3B30' }]}>
                {book.available ? 'Disponible' : 'Prestado'}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <Animated.View entering={FadeInUp.duration(600)} style={styles.coverArea}>
              <View style={[styles.bookCover, { backgroundColor: book.color + '15' }]}>
                <Ionicons name="book" size={100} color={book.color} />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)} style={styles.infoArea}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{book.title}</Text>
              <Text style={[styles.author, { color: theme.colors.textSecondary }]}>{book.author}</Text>
              
              <View style={styles.metaRow}>
                <View style={[styles.metaItem, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Año</Text>
                  <Text style={[styles.metaValue, { color: theme.colors.text }]}>{book.year}</Text>
                </View>
                <View style={[styles.metaItem, { backgroundColor: theme.colors.card }]}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>Categoría</Text>
                  <Text style={[styles.metaValue, { color: theme.colors.text }]}>{book.category}</Text>
                </View>
              </View>

              <View style={[styles.descriptionBox, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sinopsis</Text>
                <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
                  {book.description}
                </Text>
              </View>

              <View style={[styles.locationCard, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationLabel, { color: theme.colors.primary }]}>Ubicación en Biblioteca</Text>
                  <Text style={[styles.locationValue, { color: theme.colors.primary }]}>{book.location}</Text>
                </View>
              </View>

              <View style={styles.noticeBox}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
                  Acude al mostrador de la biblioteca para solicitar este ejemplar.
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  content: { paddingHorizontal: 25 },
  coverArea: { alignItems: 'center', marginVertical: 30 },
  bookCover: { width: SCREEN_WIDTH * 0.5, height: SCREEN_WIDTH * 0.7, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
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
  locationCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, gap: 15 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 12, fontWeight: '800', opacity: 0.8 },
  locationValue: { fontSize: 16, fontWeight: '900' },
  noticeBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8, marginTop: 10 },
  noticeText: { fontSize: 12, fontWeight: '500', flex: 1 },
});
