import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, X, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionItem } from '@/components/TransactionItem';
import { getTransactions, createTransaction, deleteTransaction, getBudgets, getRoast } from '@/lib/api';
import { CATEGORY_COLORS, ACCENT, getCategoriesForType, CATEGORY_IS_EXPENSE } from '@/constants';
import { Transaction, TransactionType, Category, Budget } from '@/types';

type Filter = 'all' | 'income' | 'expense';

interface RoastUpdate {
  roast: string;
}

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [latestRoast, setLatestRoast] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState('');

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    const cats = getCategoriesForType(t);
    if (!cats.includes(category)) {
      setCategory(cats[0]);
    }
  };

  const handleCategoryChange = (c: Category) => {
    setCategory(c);
    if (CATEGORY_IS_EXPENSE[c] && type === 'income') {
      setType('expense');
    } else if (!CATEGORY_IS_EXPENSE[c] && type === 'expense') {
      setType('income');
    }
    setShowCatPicker(false);
  };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [txns, bdgs] = await Promise.all([getTransactions(token), getBudgets(token)]);
      setTransactions(txns);
      setBudgets(bdgs);
    } catch {}
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => {
    setDesc(''); setAmount(''); setType('expense'); setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]); setError('');
  };

  const handleAdd = async () => {
    if (!desc.trim()) return setError('Description is required');
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return setError('Enter a valid amount');
    if (!token) return;
    try {
      await createTransaction(token, { description: desc.trim(), amount: n, type, category, date });
      await load();

      // Get a fresh roast from the "chef"
      try {
        const roast = await getRoast(token, transactions, budgets);
        setLatestRoast(roast);
      } catch {}

      setModalVisible(false);
      resetForm();
    } catch (e: any) {
      setError(e.message || 'Failed to add transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try { await deleteTransaction(token, id); setTransactions((prev) => prev.filter((t) => t.id !== id)); } catch {}
  };

  const dismissRoast = () => setLatestRoast(null);

  const filtered = transactions
    .filter((t) => filter === 'all' || t.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Transactions"
        rightElement={
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: ACCENT.blue }]} onPress={() => { if (!token) { router.replace('/(tabs)/account'); return; } setModalVisible(true); }}>
            <Plus color="#fff" size={18} />
          </TouchableOpacity>
        }
      />

      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && { backgroundColor: ACCENT.blue }]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {latestRoast && (
        <TouchableOpacity
          style={[styles.roastBanner, { backgroundColor: ACCENT.roast + '22', borderColor: ACCENT.roast + '44' }]}
          onPress={dismissRoast}
          activeOpacity={0.8}>
          <Text style={[styles.roastText, { color: colors.textPrimary }]} numberOfLines={2}>{latestRoast}</Text>
          <X color={ACCENT.roast} size={16} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}>
        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No transactions found</Text>
        ) : (
          filtered.map((t) => <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />)
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add Transaction</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeRow}>
              {(['expense', 'income'] as TransactionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, { borderColor: colors.border }, type === t && { backgroundColor: t === 'income' ? ACCENT.green : ACCENT.red, borderColor: 'transparent' }]}
                  onPress={() => handleTypeChange(t)}>
                  <Text style={[styles.typeBtnText, { color: type === t ? '#fff' : colors.textSecondary }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Description" placeholderTextColor={colors.textSecondary} value={desc} onChangeText={setDesc} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Amount" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <TextInput style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.textSecondary} value={date} onChangeText={setDate} />

            <TouchableOpacity
              style={[styles.input, styles.pickerBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowCatPicker(!showCatPicker)}>
              <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[category] }]} />
              <Text style={[styles.pickerText, { color: colors.textPrimary }]}>{category}</Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>

            {showCatPicker && (
              <View style={[styles.catDropdown, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                {getCategoriesForType(type).map((c) => (
                  <TouchableOpacity key={c} style={styles.catOption} onPress={() => handleCategoryChange(c)}>
                    <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[c] }]} />
                    <Text style={[styles.catOptionText, { color: colors.textPrimary }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: ACCENT.blue }]} onPress={handleAdd}>
              <Text style={styles.submitText}>Add Transaction</Text>
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
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  addBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: '600' },
  roastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  roastText: { flex: 1, fontSize: 13, fontStyle: 'italic', fontWeight: '500' },
  empty: { textAlign: 'center', fontSize: 14, paddingVertical: 40 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, padding: 20, gap: 12, maxHeight: '90%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  typeBtnText: { fontSize: 14, fontWeight: '600' },
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
