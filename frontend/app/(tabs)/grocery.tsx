import { auth } from '../../src/config/firebase'; 
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, spacing } from '../../src/constants/theme';
import { api } from '../../src/services/api';
import { getWeekStart, shiftWeek, formatWeekRange } from '../../src/utils/helpers';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check } from 'lucide-react-native';

interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  category?: string;
}

export default function GroceryScreen() {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchGroceryList = async () => {
    try {
      setError('');
      console.log('weekStart value:', weekStart);
      const res = await api.getGroceryList(weekStart);
      setItems(res.grocery_list?.items || []);
    } catch (e: any) {
      console.log('Fetch grocery error:', e);
      setError('Failed to load grocery list');
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        await fetchGroceryList();
        if (isActive) setLoading(false);
      };
      load();
      return () => { isActive = false; };
    }, [weekStart])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroceryList();
    setRefreshing(false);
  };

const addItem = async () => {
  const name = newItem.trim();
  if (!name) return;

  setAdding(true);
  setError('');
  try {
    const res = await api.addGroceryItem(weekStart, {
      name,
      quantity: newQuantity.trim() || undefined,
    });

    setItems(res.grocery_list?.items || []);
    setNewItem('');
    setNewQuantity('');
  } catch (e: any) {
    console.log('Add item error:', e);
    setError('Failed to add item: ' + (e.message || 'Unknown error'));
  }
  setAdding(false);
};

  const toggleItem = async (itemId: string) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i));
    try {
      const res = await api.toggleGroceryItem(weekStart, itemId);
      setItems(res.grocery_list?.items || []);
    } catch (e: any) {
      console.log('Toggle item error:', e);
      // Revert on error
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i));
      setError('Failed to update item');
    }
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic update
    const prevItems = items;
    setItems(prev => prev.filter(i => i.id !== itemId));
    try {
      const res = await api.deleteGroceryItem(weekStart, itemId);
      setItems(res.grocery_list?.items || []);
    } catch (e: any) {
      console.log('Delete item error:', e);
      setItems(prevItems);
      setError('Failed to delete item');
    }
  };

  const uncheckedItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);
  const progress = items.length > 0 ? Math.round((checkedItems.length / items.length) * 100) : 0;

  const renderItem = ({ item }: { item: GroceryItem }) => (
    <View style={[styles.groceryItem, item.checked && styles.groceryItemChecked]}>
      <TouchableOpacity
        testID={`grocery-checkbox-${item.id}`}
        style={[styles.checkbox, item.checked && styles.checkboxChecked]}
        onPress={() => toggleItem(item.id)}
      >
        {item.checked && <Check size={14} color="#fff" strokeWidth={3} />}
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
        {item.quantity ? <Text style={[styles.itemQuantity, item.checked && styles.itemQuantityChecked]}>{item.quantity}</Text> : null}
      </View>
      <TouchableOpacity
        testID={`grocery-delete-${item.id}`}
        style={styles.deleteBtn}
        onPress={() => deleteItem(item.id)}
      >
        <Trash2 size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Text style={styles.title}>Grocery List</Text>
          <View style={styles.weekNav}>
            <TouchableOpacity testID="grocery-prev-week" onPress={() => setWeekStart(shiftWeek(weekStart, -1))} style={styles.navBtn}>
              <ChevronLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.weekLabel}>{formatWeekRange(weekStart)}</Text>
            <TouchableOpacity testID="grocery-next-week" onPress={() => setWeekStart(shiftWeek(weekStart, 1))} style={styles.navBtn}>
              <ChevronRight size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {items.length > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{checkedItems.length}/{items.length} items</Text>
          </View>
        )}

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={colors.brandPrimary} /></View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>List is empty</Text>
            <Text style={styles.emptyText}>Add items below to start{'\n'}your grocery checklist</Text>
          </View>
        ) : (
          <FlatList
            data={[...uncheckedItems, ...checkedItems]}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Add Item - always visible */}
        <View style={styles.addContainer}>
          <View style={styles.addInputRow}>
            <TextInput
              testID="grocery-item-input"
              style={styles.addInput}
              placeholder="Add item..."
              placeholderTextColor={colors.textTertiary}
              value={newItem}
              onChangeText={(t) => { setNewItem(t); setError(''); }}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <TextInput
              testID="grocery-quantity-input"
              style={styles.quantityInput}
              placeholder="Qty"
              placeholderTextColor={colors.textTertiary}
              value={newQuantity}
              onChangeText={setNewQuantity}
              onSubmitEditing={addItem}
            />
            <TouchableOpacity
              testID="grocery-add-btn"
              style={[styles.addBtn, (!newItem.trim() || adding) && styles.addBtnDisabled]}
              onPress={addItem}
              disabled={!newItem.trim() || adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Plus size={22} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  progressContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 3 },
  progressText: { fontSize: 13, color: colors.textTertiary, fontWeight: '500' },
  errorBanner: { color: colors.error, fontSize: 13, textAlign: 'center', paddingVertical: 6, backgroundColor: '#FFF0EE', marginHorizontal: spacing.lg, borderRadius: 8, marginTop: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  emptyText: { fontSize: 15, color: colors.textTertiary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 20 },
  groceryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  groceryItemChecked: { opacity: 0.5 },
  checkbox: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  itemInfo: { flex: 1, marginLeft: 14 },
  itemName: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  itemNameChecked: { textDecorationLine: 'line-through', color: colors.textTertiary },
  itemQuantity: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  itemQuantityChecked: { textDecorationLine: 'line-through' },
  deleteBtn: { padding: 8 },
  separator: { height: 1, backgroundColor: colors.divider },
  addContainer: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.elevated,
  },
  addInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addInput: {
    flex: 1, height: 48, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 15, color: colors.textPrimary,
  },
  quantityInput: {
    width: 70, height: 48, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 12, fontSize: 15, color: colors.textPrimary, textAlign: 'center',
  },
  addBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
});
