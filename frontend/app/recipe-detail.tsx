import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '../src/constants/theme';
import { api } from '../src/services/api';
import { getPlatformIcon } from '../src/utils/helpers';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react-native';
import * as Linking from 'expo-linking';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const res = await api.getRecipes();
      const found = (res.recipes || []).find((r: any) => r.id === id);
      setRecipe(found || null);
    } catch (e) {
      console.log('Fetch recipe error:', e);
    }
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.deleteRecipe(id!);
            router.back();
          } catch (e) {
            console.log('Delete error:', e);
          }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}><Text style={styles.notFound}>Recipe not found</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity testID="delete-recipe-btn" onPress={handleDelete} style={styles.deleteBtn}>
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.platformEmoji}>{getPlatformIcon(recipe.platform)}</Text>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{recipe.platform}</Text>
          </View>
        </View>

        {/* Title & Link */}
        <View style={styles.titleSection}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <TouchableOpacity
            testID="open-recipe-link"
            style={styles.linkButton}
            onPress={() => Linking.openURL(recipe.url)}
            activeOpacity={0.7}
          >
            <ExternalLink size={16} color={colors.textInverse} />
            <Text style={styles.linkButtonText}>Open Recipe</Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TAGS</Text>
            <View style={styles.tagRow}>
              {recipe.tags.map((tag: string, i: number) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INGREDIENTS</Text>
            {recipe.ingredients.map((ing: string, i: number) => (
              <View key={i} style={styles.ingredientItem}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {recipe.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <Text style={styles.notesText}>{recipe.notes}</Text>
          </View>
        ) : null}

        {/* URL */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SOURCE</Text>
          <Text style={styles.urlText} numberOfLines={2}>{recipe.url}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, color: colors.textTertiary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  content: { paddingBottom: spacing.xxl },
  hero: {
    height: 160, backgroundColor: colors.surface, justifyContent: 'center',
    alignItems: 'center', marginHorizontal: spacing.lg, borderRadius: 16,
  },
  platformEmoji: { fontSize: 48 },
  platformBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999,
  },
  platformText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  titleSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  recipeTitle: { fontSize: 28, fontWeight: '300', color: colors.textPrimary, fontStyle: 'italic', lineHeight: 34 },
  linkButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.brandPrimary, alignSelf: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 9999, marginTop: spacing.md,
  },
  linkButtonText: { color: colors.textInverse, fontWeight: '600', fontSize: 14 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999, backgroundColor: colors.tagBg },
  tagText: { fontSize: 14, color: colors.tagText, fontWeight: '500' },
  ingredientItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  ingredientDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 14 },
  ingredientText: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  notesText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  urlText: { fontSize: 13, color: colors.textTertiary, lineHeight: 18 },
});
