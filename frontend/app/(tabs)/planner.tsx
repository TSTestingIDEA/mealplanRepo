import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, spacing } from '../../src/constants/theme';
import { api } from '../../src/services/api';
import { getWeekStart, getWeekDates, shiftWeek, formatWeekRange, getPlatformIcon } from '../../src/utils/helpers';
import { ChevronLeft, ChevronRight, Plus, X, Edit3 } from 'lucide-react-native';
import * as Linking from 'expo-linking';

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

export default function PlannerScreen() {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMeal, setPickerMeal] = useState('');
  const [pickerDay, setPickerDay] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState('');

  const weekDates = getWeekDates(weekStart);

  const fetchMealPlan = async () => {
    try {
      const res = await api.getMealPlan(weekStart);
      setMealPlan(res.meal_plan);
    } catch (e) {
      console.log('Fetch meal plan error:', e);
    }
  };

  const fetchRecipes = async () => {
    try {
      const res = await api.getRecipes();
      setRecipes(res.recipes || []);
    } catch (e) {
      console.log('Fetch recipes error:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await Promise.all([fetchMealPlan(), fetchRecipes()]);
        if (isActive) setLoading(false);
      };
      load();
      return () => { isActive = false; };
    }, [weekStart])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMealPlan(), fetchRecipes()]);
    setRefreshing(false);
  };

  const saveMealSlot = async (day: string, meal: string, slotData: any) => {
    if (!mealPlan) return;
    const updatedDays = { ...mealPlan.days };
    if (!updatedDays[day]) updatedDays[day] = { breakfast: null, lunch: null, dinner: null };
    updatedDays[day][meal] = slotData;

    try {
      const res = await api.updateMealPlan({ week_start: weekStart, days: updatedDays });
      setMealPlan(res.meal_plan);
      setError('');
    } catch (e: any) {
      console.log('Update meal plan error:', e);
      setError('Failed to update meal plan');
    }
  };

  const assignRecipe = async (recipe: any) => {
    await saveMealSlot(pickerDay, pickerMeal, {
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      recipe_url: recipe.url,
      recipe_thumbnail: recipe.thumbnail,
    });
    setShowPicker(false);
  };

  const assignManual = async () => {
    if (!manualName.trim()) return;
    await saveMealSlot(pickerDay, pickerMeal, {
      recipe_id: null,
      recipe_title: manualName.trim(),
      recipe_url: manualUrl.trim() || null,
      recipe_thumbnail: null,
    });
    setManualName('');
    setManualUrl('');
    setShowManualInput(false);
    setShowPicker(false);
  };

  const clearSlot = async (day: string, meal: string) => {
    await saveMealSlot(day, meal, null);
  };

  const openRecipePicker = (day: string, meal: string) => {
    setPickerDay(day);
    setPickerMeal(meal);
    setManualName('');
    setManualUrl('');
    setShowManualInput(false);
    setShowPicker(true);
  };

  const currentDay = weekDates[selectedDay];
  const dayPlan = mealPlan?.days?.[currentDay?.day] || { breakfast: null, lunch: null, dinner: null };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <View style={styles.weekNav}>
          <TouchableOpacity testID="prev-week-btn" onPress={() => setWeekStart(shiftWeek(weekStart, -1))} style={styles.navBtn}>
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{formatWeekRange(weekStart)}</Text>
          <TouchableOpacity testID="next-week-btn" onPress={() => setWeekStart(shiftWeek(weekStart, 1))} style={styles.navBtn}>
            <ChevronRight size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
        {weekDates.map((wd, i) => (
          <TouchableOpacity
            key={wd.day}
            testID={`day-tab-${wd.day}`}
            style={[styles.dayTab, selectedDay === i && styles.dayTabActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[styles.dayLabel, selectedDay === i && styles.dayLabelActive]}>{wd.label}</Text>
            <Text style={[styles.dayDate, selectedDay === i && styles.dayDateActive]}>{wd.dateStr}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>
      ) : (
        <ScrollView
          style={styles.mealsScroll}
          contentContainerStyle={styles.mealsContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
        >
          <Text style={styles.dayFullLabel}>{currentDay?.fullLabel}</Text>
          {MEALS.map((meal) => {
            const slot = dayPlan[meal];
            return (
              <View key={meal} style={styles.mealSlot}>
                <Text style={styles.mealLabel}>{MEAL_LABELS[meal]}</Text>
                {slot?.recipe_title ? (
                  <View style={styles.filledSlot}>
                    <TouchableOpacity
                      style={styles.filledContent}
                      onPress={() => slot.recipe_url ? Linking.openURL(slot.recipe_url) : null}
                      activeOpacity={slot.recipe_url ? 0.7 : 1}
                    >
                      <Text style={styles.recipeTitle} numberOfLines={2}>{slot.recipe_title}</Text>
                      {slot.recipe_url ? (
                        <Text style={styles.viewLink}>View recipe →</Text>
                      ) : (
                        <Text style={styles.manualLabel}>Manual entry</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`clear-${currentDay?.day}-${meal}`}
                      style={styles.clearBtn}
                      onPress={() => clearSlot(currentDay?.day, meal)}
                    >
                      <X size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    testID={`add-meal-${currentDay?.day}-${meal}`}
                    style={styles.emptySlot}
                    onPress={() => openRecipePicker(currentDay?.day, meal)}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color={colors.textTertiary} />
                    <Text style={styles.emptySlotText}>Add meal</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Recipe Picker Modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {MEAL_LABELS[pickerMeal] || 'Meal'}
              </Text>
              <TouchableOpacity testID="close-picker-btn" onPress={() => setShowPicker(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Manual Entry Section */}
            <View style={styles.manualSection}>
              {!showManualInput ? (
                <TouchableOpacity
                  testID="manual-entry-toggle"
                  style={styles.manualToggle}
                  onPress={() => setShowManualInput(true)}
                >
                  <Edit3 size={16} color={colors.accent} />
                  <Text style={styles.manualToggleText}>Type a meal name manually</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.manualForm}>
                  <TextInput
                    testID="manual-meal-name"
                    style={styles.manualInput}
                    placeholder="Meal name (e.g. Dal Rice, Pasta)"
                    placeholderTextColor={colors.textTertiary}
                    value={manualName}
                    onChangeText={setManualName}
                    autoFocus
                  />
                  <TextInput
                    testID="manual-meal-url"
                    style={styles.manualInput}
                    placeholder="Recipe link (optional)"
                    placeholderTextColor={colors.textTertiary}
                    value={manualUrl}
                    onChangeText={setManualUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <View style={styles.manualActions}>
                    <TouchableOpacity style={styles.manualCancelBtn} onPress={() => setShowManualInput(false)}>
                      <Text style={styles.manualCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="manual-save-btn"
                      style={[styles.manualSaveBtn, !manualName.trim() && styles.manualSaveBtnDisabled]}
                      onPress={assignManual}
                      disabled={!manualName.trim()}
                    >
                      <Text style={styles.manualSaveText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Divider */}
            {recipes.length > 0 && (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or pick from saved recipes</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* Recipe List */}
            {recipes.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>No saved recipes yet.{'\n'}Type a meal name above instead!</Text>
              </View>
            ) : (
              <FlatList
                data={recipes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    testID={`pick-recipe-${item.id}`}
                    style={styles.pickerItem}
                    onPress={() => assignRecipe(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerEmoji}>{getPlatformIcon(item.platform)}</Text>
                    <View style={styles.pickerInfo}>
                      <Text style={styles.pickerTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.pickerPlatform}>{item.platform}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: 32, fontWeight: '300', color: colors.textPrimary, fontStyle: 'italic' },
  weekNav: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  navBtn: { padding: 6 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  errorBanner: { color: colors.error, fontSize: 13, textAlign: 'center', paddingVertical: 6, backgroundColor: '#FFF0EE', marginHorizontal: spacing.lg, borderRadius: 8, marginTop: 4 },
  dayTabs: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 8 },
  dayTab: { width: 56, height: 68, borderRadius: 16, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  dayTabActive: { backgroundColor: colors.brandPrimary },
  dayLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  dayLabelActive: { color: colors.textInverse },
  dayDate: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  dayDateActive: { color: 'rgba(255,255,255,0.7)' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mealsScroll: { flex: 1 },
  mealsContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  dayFullLabel: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  mealSlot: { marginBottom: spacing.lg },
  mealLabel: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  filledSlot: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  filledContent: { flex: 1, padding: 16 },
  recipeTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  viewLink: { fontSize: 13, color: colors.accent, marginTop: 4, fontWeight: '500' },
  manualLabel: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  clearBtn: { padding: 16 },
  emptySlot: {
    height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 8, backgroundColor: colors.surface,
  },
  emptySlotText: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  modalTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  manualSection: { padding: spacing.lg, paddingBottom: 0 },
  manualToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.accentMuted, borderRadius: 12 },
  manualToggleText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  manualForm: { gap: 10 },
  manualInput: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: colors.textPrimary },
  manualActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  manualCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  manualCancelText: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' },
  manualSaveBtn: { backgroundColor: colors.accent, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 9999 },
  manualSaveBtnDisabled: { opacity: 0.4 },
  manualSaveText: { color: colors.textInverse, fontWeight: '600', fontSize: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { paddingHorizontal: 12, fontSize: 12, color: colors.textTertiary },
  modalEmpty: { padding: spacing.xxl, alignItems: 'center' },
  modalEmptyText: { fontSize: 15, color: colors.textTertiary, textAlign: 'center', lineHeight: 22 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  pickerEmoji: { fontSize: 28, marginRight: 14 },
  pickerInfo: { flex: 1 },
  pickerTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  pickerPlatform: { fontSize: 12, color: colors.textTertiary, marginTop: 2, textTransform: 'capitalize' },
});
