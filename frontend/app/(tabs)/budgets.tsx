import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, X, Trash2, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BudgetCard } from '@/components/BudgetCard';
import { getBudgets, createBudget, deleteBudget } from '@/lib/api';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, ACCENT } from '@/constants';
import { Budget, Category } from '@/types';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState<Category>('Food');
  const [limit, setLimit] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try { setBudgets(await getBudgets(token)); } catch {}
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => { setCategory('Food'); setLimit(''); setError(''); };

  const handleAdd = async () => {
    const n = parseFloat(limit);
    if (isNaN(n) || n <= 0) return setError('Enter a valid limit amount');
    if (!token) return;
    try {
      await createBudget(token, { category, limit: n });
      await load();
      setModalVisible(false);
      resetForm();
    } catch (e: any) {
      setError(e.message || 'Failed to set budget');
    }
  };

  const handleDelete = async (cat: string) => {
    if (!token) return;
    try { await deleteBudget(token, cat); setBudgets((prev) => prev.filter((b) => b.category !== cat)); } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Budgets"
        rightElement={
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: ACCENT.blue }]} onPress={() => { if (!token) { router.replace('/(tabs)/account'); return; } setModalVisible(true); }}>
            <Plus color="#fff" size={18} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}>
        {budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No budgets set</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap + to set a monthly budget for a category</Text>
          </View>
        ) : (
          budgets.map((b) => (
            <View key={b.category} style={styles.budgetRow}>
              <View style={{ flex: 1 }}>
                <BudgetCard budget={b} />
              </View>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleDelete(b.category)}>
                <Trash2 color={ACCENT.red} size={16} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Set Budget</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.input, styles.pickerBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowCatPicker(!showCatPicker)}>
              <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[category] }]} />
              <Text style={[styles.pickerText, { color: colors.textPrimary }]}>{category}</Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>

            {showCatPicker && (
              <View style={[styles.catDropdown, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <TouchableOpacity key={c} style={styles.catOption} onPress={() => { setCategory(c); setShowCatPicker(false); }}>
                    <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[c] }]} />
                    <Text style={[styles.catOptionText, { color: colors.textPrimary }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Monthly limit ($)" placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad" value={limit} onChangeText={setLimit} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: ACCENT.blue }]} onPress={handleAdd}>
              <Text style={styles.submitText}>Set Budget</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  addBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  input: { height: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerText: { flex: 1, fontSize: 14 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catDropdown: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  catOptionText: { fontSize: 14 },
  errorText: { color: '#D85A30', fontSize: 13 },
  submitBtn: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
