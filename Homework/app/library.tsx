import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = ['Todos', 'Literatura', 'Ciencia', 'Historia', 'Arte', 'Matemáticas'];

const MOCK_BOOKS = [
  { id: '1', title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', category: 'Literatura', available: true, cover: 'book-outline', color: '#FF9500' },
  { id: '2', title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', category: 'Literatura', available: false, cover: 'book-outline', color: '#5856D6' },
  { id: '3', title: 'Breve Historia del Tiempo', author: 'Stephen Hawking', category: 'Ciencia', available: true, cover: 'flask-outline', color: '#007AFF' },
  { id: '4', title: 'La República', author: 'Platón', category: 'Historia', available: true, cover: 'library-outline', color: '#34C759' },
  { id: '5', title: 'El Principito', author: 'Antoine de Saint-Exupéry', category: 'Literatura', available: true, cover: 'star-outline', color: '#FF2D55' },
  { id: '6', title: 'Cálculo Superior', author: 'James Stewart', category: 'Matemáticas', available: false, cover: 'calculator-outline', color: '#AF52DE' },
];

export default function LibraryScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/library/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks(MOCK_BOOKS); // Fallback to mock on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) || book.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Biblioteca Escolar</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput 
              placeholder="Buscar por título o autor..."
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.searchInput, { color: theme.colors.text }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
            {CATEGORIES.map((cat) => (
              <Pressable 
                key={cat} 
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryBtn, 
                  { backgroundColor: selectedCategory === cat ? theme.colors.primary : theme.colors.card }
                ]}
              >
                <Text style={[styles.categoryText, { color: selectedCategory === cat ? '#FFF' : theme.colors.textSecondary }]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredBooks}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Animated.View 
                entering={FadeInDown.delay(index * 100)}
                style={styles.bookWrapper}
              >
                <Pressable 
                  onPress={() => router.push(`/book/${item.id}`)}
                  style={[styles.bookCard, { backgroundColor: theme.colors.card }]}
                >
                  <View style={[styles.bookCover, { backgroundColor: (item.color || '#007AFF') + '10' }]}>
                    <Ionicons name={(item.cover || 'book-outline') as any} size={50} color={item.color || '#007AFF'} />
                    {!item.available && (
                      <View style={styles.borrowedBadge}>
                        <Text style={styles.borrowedText}>Prestado</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.bookAuthor, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.author}</Text>
                    <View style={styles.bookFooter}>
                      <Text style={[styles.bookCategory, { color: item.color || '#007AFF' }]}>
                        {typeof item.category === 'object' ? item.category?.name : item.category}
                      </Text>
                      <Ionicons 
                        name={item.available ? "checkmark-circle" : "time"} 
                        size={14} 
                        color={item.available ? theme.colors.success : theme.colors.textSecondary} 
                      />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No se encontraron obras</Text>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  searchContainer: { paddingHorizontal: 25, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  categoriesContainer: { marginBottom: 20 },
  categoriesList: { paddingHorizontal: 25, gap: 10 },
  categoryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  categoryText: { fontSize: 13, fontWeight: '700' },
  gridContent: { paddingHorizontal: 15, paddingBottom: 40 },
  bookWrapper: { width: '50%', padding: 10 },
  bookCard: { borderRadius: 24, overflow: 'hidden', height: 260 },
  bookCover: { height: 160, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  borrowedBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  borrowedText: { color: '#FFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  bookInfo: { padding: 12, flex: 1, justifyContent: 'space-between' },
  bookTitle: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  bookAuthor: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  bookFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  bookCategory: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', marginTop: 60, flex: 1 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
});
