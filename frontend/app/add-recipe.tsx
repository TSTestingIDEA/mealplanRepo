import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../src/constants/theme';
import { api } from '../src/services/api';
import { detectPlatform } from '../src/utils/helpers';
import { X, Plus, Link } from 'lucide-react-native';

export default function AddRecipeScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addIngredient = () => {
    const ing = ingredientInput.trim();
    if (ing && !ingredients.includes(ing)) {
      setIngredients([...ingredients, ing]);
    }
    setIngredientInput('');
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('Missing URL', 'Please paste a recipe link');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please add a title for this recipe');
      return;
    }

    setSaving(true);
    try {
      await api.createRecipe({
        url: url.trim(),
        title: title.trim(),
        tags,
        ingredients,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
      console.log('Save recipe error:', e);
    }
    setSaving(false);
  };

  const platform = url ? detectPlatform(url) : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="close-add-recipe" onPress={() => router.back()} style={styles.closeBtn}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Recipe</Text>
          <TouchableOpacity
            testID="save-recipe-btn"
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {/* URL Input */}
          <View style={styles.section}>
            <Text style={styles.label}>RECIPE LINK</Text>
            <View style={styles.urlInputContainer}>
              <Link size={18} color={colors.textTertiary} />
              <TextInput
                testID="recipe-url-input"
                style={styles.urlInput}
                placeholder="Paste Instagram, YouTube or Facebook link"
                placeholderTextColor={colors.textTertiary}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            {platform ? (
              <View style={styles.platformIndicator}>
                <Text style={styles.platformText}>Detected: {platform}</Text>
              </View>
            ) : null}
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>RECIPE TITLE</Text>
            <TextInput
              testID="recipe-title-input"
              style={styles.input}
              placeholder="e.g. Butter Chicken, Pasta Carbonara"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.label}>TAGS</Text>
            <View style={styles.chipInputRow}>
              <TextInput
                testID="tag-input"
                style={styles.chipInput}
                placeholder="e.g. spicy, vegan, protein"
                placeholderTextColor={colors.textTertiary}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <TouchableOpacity testID="add-tag-btn" style={styles.chipAddBtn} onPress={addTag}>
                <Plus size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
            {tags.length > 0 && (
              <View style={styles.chipRow}>
                {tags.map((tag) => (
                  <TouchableOpacity key={tag} style={styles.chip} onPress={() => removeTag(tag)}>
                    <Text style={styles.chipText}>{tag}</Text>
                    <X size={12} color={colors.tagText} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.label}>INGREDIENTS</Text>
            <View style={styles.chipInputRow}>
              <TextInput
                testID="ingredient-input"
                style={styles.chipInput}
                placeholder="e.g. chicken, garlic, olive oil"
                placeholderTextColor={colors.textTertiary}
                value={ingredientInput}
                onChangeText={setIngredientInput}
                onSubmitEditing={addIngredient}
                returnKeyType="done"
              />
              <TouchableOpacity testID="add-ingredient-btn" style={styles.chipAddBtn} onPress={addIngredient}>
                <Plus size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
            {ingredients.length > 0 && (
              <View style={styles.chipRow}>
                {ingredients.map((ing) => (
                  <TouchableOpacity key={ing} style={styles.ingredientChip} onPress={() => removeIngredient(ing)}>
                    <Text style={styles.ingredientChipText}>{ing}</Text>
                    <X size={12} color={colors.brandPrimary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>NOTES (OPTIONAL)</Text>
            <TextInput
              testID="recipe-notes-input"
              style={[styles.input, styles.notesInput]}
              placeholder="Any personal notes about this recipe..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  saveBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.textInverse, fontWeight: '600', fontSize: 14 },
  form: { flex: 1 },
  formContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.sm },
  urlInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  urlInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary },
  platformIndicator: { marginTop: 6, paddingLeft: 4 },
  platformText: { fontSize: 12, color: colors.success, fontWeight: '500', textTransform: 'capitalize' },
  input: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 15, color: colors.textPrimary },
  notesInput: { height: 100, paddingTop: 14 },
  chipInputRow: { flexDirection: 'row', gap: 8 },
  chipInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 16, height: 48, fontSize: 15, color: colors.textPrimary,
  },
  chipAddBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: colors.brandPrimary,
    justifyContent: 'center', alignItems: 'center',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: colors.tagBg,
  },
  chipText: { fontSize: 13, color: colors.tagText, fontWeight: '500' },
  ingredientChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999,
    backgroundColor: '#E8F5E9',
  },
  ingredientChipText: { fontSize: 13, color: colors.brandPrimary, fontWeight: '600' },
});
