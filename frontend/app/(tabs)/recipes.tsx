import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, spacing } from '../../src/constants/theme';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { Plus, Search, X, LogOut } from 'lucide-react-native';
import { getPlatformIcon } from '../../src/utils/helpers';

interface Recipe {
  id: string;
  url: string;
  title: string;
  platform: string;
  tags: string[];
  ingredients: string[];
  thumbnail?: string;
  created_at: string;
}

export default function RecipesScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchRecipes = async () => {
    try {
      const res = searchQuery || selectedTag
        ? await api.searchRecipes(searchQuery, selectedTag)
        : await api.getRecipes();
      setRecipes(res.recipes || []);
    } catch (e) {
      console.log('Fetch recipes error:', e);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.getTags();
      setAllTags(res.tags || []);
    } catch (e) {
      console.log('Fetch tags error:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchRecipes(), fetchTags()]);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [searchQuery, selectedTag])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const RECIPE_PLACEHOLDER = 'https://static.prod-images.emergentagent.com/jobs/3abfe753-7d87-44d4-9874-01a7e1b53b6f/images/335726602e552f475e643488334c456741b86bddd6e19a620422dec822292e67.png';

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      testID={`recipe-card-${item.id}`}
      style={styles.recipeCard}
      onPress={() => router.push({ pathname: '/recipe-detail', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View style={styles.cardImageContainer}>
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.platformEmoji}>{getPlatformIcon(item.platform)}</Text>
        </View>
        <View style={styles.platformBadge}>
          <Text style={styles.platformBadgeText}>{item.platform}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>{item.title}</Text>
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTag}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
        {item.ingredients.length > 0 && (
          <Text style={styles.ingredientPreview} numberOfLines={1}>
            {item.ingredients.slice(0, 4).join(' · ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Our Kitchen</Text>
          <Text style={styles.subtitle}>{recipes.length} recipes saved</Text>
        </View>
        <TouchableOpacity testID="logout-btn" onPress={logout} style={styles.logoutBtn}>
          <LogOut size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={colors.textTertiary} />
        <TextInput
          testID="recipe-search-input"
          style={styles.searchInput}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <FlatList
          horizontal
          data={['', ...allTags]}
          keyExtractor={(item) => item || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsFilter}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`tag-filter-${item || 'all'}`}
              style={[styles.filterTag, selectedTag === item && styles.filterTagActive]}
              onPress={() => setSelectedTag(item)}
            >
              <Text style={[styles.filterTagText, selectedTag === item && styles.filterTagTextActive]}>
                {item || 'All'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Recipe List */}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍳</Text>
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptyText}>Save your favorite recipes from{'\n'}Instagram, YouTube & Facebook</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        testID="add-recipe-fab"
        style={styles.fab}
        onPress={() => router.push('/add-recipe')}
        activeOpacity={0.7}
      >
        <Plus size={24} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  greeting: { fontSize: 32, fontWeight: '300', color: colors.textPrimary, fontStyle: 'italic' },
  subtitle: { fontSize: 14, color: colors.textTertiary, marginTop: 2 },
  logoutBtn: { padding: spacing.sm },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, height: 46, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary },
  tagsFilter: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 8 },
  filterTag: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 9999, backgroundColor: colors.surface },
  filterTagActive: { backgroundColor: colors.brandPrimary },
  filterTagText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterTagTextActive: { color: colors.textInverse },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  recipeCard: {
    backgroundColor: colors.elevated, borderRadius: 12, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardImageContainer: { height: 120, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  cardImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  platformEmoji: { fontSize: 36 },
  platformBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999 },
  platformBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardContent: { padding: 14 },
  recipeTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, backgroundColor: colors.tagBg },
  tagText: { fontSize: 12, color: colors.tagText, fontWeight: '500' },
  moreTag: { fontSize: 12, color: colors.textTertiary, alignSelf: 'center' },
  ingredientPreview: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  emptyText: { fontSize: 15, color: colors.textTertiary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.accent, justifyContent: 'center',
    alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
});
