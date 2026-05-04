/**
 * Library Screen
 *
 * Displays a searchable, filterable book catalog using real API data.
 * Uses useInfiniteQuery for paginated book loading (20 per page),
 * debounced search, category filtering, pull-to-refresh, and
 * skeleton/error/empty states.
 *
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.10
 */

import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useBookCategories, useBooks } from '@/hooks/api/useLibrary';
import { useTheme } from '@/hooks/useTheme';
import type { Book, BookCategory } from '@/types/library';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDebounce } from '@/hooks/useDebounce';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Map category names to icon/color for visual variety */
const CATEGORY_VISUALS: Record<string, { icon: string; color: string }> = {
  Literatura: { icon: 'book-outline', color: '#FF9500' },
  Ciencia: { icon: 'flask-outline', color: '#007AFF' },
  Historia: { icon: 'library-outline', color: '#34C759' },
  Arte: { icon: 'color-palette-outline', color: '#FF2D55' },
  Matemáticas: { icon: 'calculator-outline', color: '#AF52DE' },
  Tecnología: { icon: 'hardware-chip-outline', color: '#5AC8FA' },
};

const DEFAULT_VISUAL = { icon: 'book-outline', color: '#5856D6' };

function getBookVisual(category?: BookCategory | string) {
  const name = typeof category === 'object' ? category?.name : category;
  return (name && CATEGORY_VISUALS[name]) || DEFAULT_VISUAL;
}

export default function LibraryScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 400);

  // Fetch categories for the filter chips
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useBookCategories();

  // Fetch books with search and category filtering via useInfiniteQuery
  const {
    data: booksData,
    isLoading: booksLoading,
    isError: booksError,
    error: booksErrorObj,
    refetch: refetchBooks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useBooks({
    search: debouncedSearch || undefined,
    categoryId: selectedCategoryId,
  });

  // Flatten paginated book data
  const books = useMemo(() => {
    if (!booksData?.pages) return [];
    return booksData.pages.flatMap((page) => page.data);
  }, [booksData]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetchBooks();
  }, [refetchBooks]);

  const handleCategoryPress = useCallback((categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const getCategoryName = useCallback((book: Book) => {
    if (book.category?.name) return book.category.name;
    // Fallback: find category name from loaded categories
    const cat = categories?.find((c) => c.id === book.categoryId);
    return cat?.name || '';
  }, [categories]);

  const renderBookItem = useCallback(({ item, index }: { item: Book; index: number }) => {
    const visual = getBookVisual(item.category);

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index, 6) * 80)}
        style={styles.bookWrapper}
      >
        <Pressable
          onPress={() => router.push(`/book/${item.id}`)}
          style={[styles.bookCard, { backgroundColor: theme.colors.card }]}
          accessibilityRole="button"
          accessibilityLabel={`${item.title} por ${item.author}${item.available ? '' : ', prestado'}`}
        >
          <View style={[styles.bookCover, { backgroundColor: visual.color + '10' }]}>
            {item.coverUrl ? (
              <Ionicons name="image-outline" size={50} color={visual.color} />
            ) : (
              <Ionicons name={visual.icon as any} size={50} color={visual.color} />
            )}
            {!item.available && (
              <View style={styles.borrowedBadge}>
                <Text style={styles.borrowedText}>Prestado</Text>
              </View>
            )}
          </View>
          <View style={styles.bookInfo}>
            <Text style={[styles.bookTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.author}
            </Text>
            <View style={styles.bookFooter}>
              <Text style={[styles.bookCategory, { color: visual.color }]}>
                {getCategoryName(item)}
              </Text>
              <Ionicons
                name={item.available ? 'checkmark-circle' : 'time'}
                size={14}
                color={item.available ? theme.colors.success : theme.colors.textSecondary}
              />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }, [theme, getCategoryName]);

  const isInitialLoading = booksLoading && !booksData;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Biblioteca Escolar</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              placeholder="Buscar por título o autor..."
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.searchInput, { color: theme.colors.text }]}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Buscar libros"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} accessibilityLabel="Limpiar búsqueda">
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
            {/* "All" chip */}
            <Pressable
              onPress={() => handleCategoryPress(undefined)}
              style={[
                styles.categoryBtn,
                { backgroundColor: selectedCategoryId === undefined ? theme.colors.primary : theme.colors.card },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategoryId === undefined }}
              accessibilityLabel="Todos los libros"
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedCategoryId === undefined ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                Todos
              </Text>
            </Pressable>

            {/* Dynamic category chips from API */}
            {categoriesLoading ? (
              // Show placeholder chips while loading
              Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={`skeleton-cat-${i}`}
                  style={[styles.categoryBtn, { backgroundColor: theme.colors.card, width: 80 }]}
                />
              ))
            ) : (
              categories?.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategoryPress(cat.id)}
                  style={[
                    styles.categoryBtn,
                    { backgroundColor: selectedCategoryId === cat.id ? theme.colors.primary : theme.colors.card },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCategoryId === cat.id }}
                  accessibilityLabel={`Categoría ${cat.name}`}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: selectedCategoryId === cat.id ? '#FFF' : theme.colors.textSecondary },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        {/* Content Area */}
        {isInitialLoading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonLoader rows={6} variant="card" />
          </View>
        ) : booksError ? (
          <ErrorState
            error={booksErrorObj!}
            onRetry={() => refetchBooks()}
            onBack={() => router.back()}
          />
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={[styles.gridContent, books.length === 0 && styles.emptyGridContent]}
            showsVerticalScrollIndicator={false}
            renderItem={renderBookItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              debouncedSearch ? (
                <EmptyState
                  icon="search-outline"
                  title="Sin resultados"
                  message={`No se encontraron libros para "${debouncedSearch}"`}
                  actionLabel="Limpiar búsqueda"
                  onAction={() => setSearch('')}
                />
              ) : (
                <EmptyState
                  icon="library-outline"
                  title="Biblioteca vacía"
                  message="No hay libros disponibles en este momento."
                />
              )
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ paddingVertical: 16 }}
                />
              ) : null
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  searchContainer: { paddingHorizontal: 25, marginBottom: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 16,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  categoriesContainer: { marginBottom: 20 },
  categoriesList: { paddingHorizontal: 25, gap: 10 },
  categoryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, minHeight: 38 },
  categoryText: { fontSize: 13, fontWeight: '700' },
  skeletonContainer: { flex: 1, paddingHorizontal: 15 },
  gridContent: { paddingHorizontal: 15, paddingBottom: 40 },
  emptyGridContent: { flexGrow: 1 },
  bookWrapper: { width: '50%', padding: 10 },
  bookCard: { borderRadius: 24, overflow: 'hidden', height: 260 },
  bookCover: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  borrowedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  borrowedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bookInfo: { padding: 12, flex: 1, justifyContent: 'space-between' },
  bookTitle: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  bookAuthor: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  bookCategory: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});
