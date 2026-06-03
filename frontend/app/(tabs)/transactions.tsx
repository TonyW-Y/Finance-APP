import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, X, ChevronDown, Search, Calendar } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TransactionItem } from '@/components/TransactionItem';
import { getTransactions, createTransaction, deleteTransaction } from '@/lib/api';
import { CATEGORY_COLORS, ACCENT, getCategoriesForType, CATEGORY_IS_EXPENSE, CATEGORIES } from '@/constants';
import { Transaction, TransactionType, Category } from '@/types';

type Filter = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState('');

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      const filters: any = {};
      if (filter !== 'all') filters.type = filter;
      if (search) filters.search = search;
      if (catFilter) filters.category = catFilter;
      const txns = await getTransactions(token, filters);
      setTransactions(txns);
    } catch {}
  }, [token, filter, search, catFilter]);

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

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setDate(selected.toISOString().split('T')[0]);
    }
  };

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

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Search color={colors.textSecondary} size={16} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search transactions..." placeholderTextColor={colors.textSecondary}
          value={search} onChangeText={setSearch} />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X color={colors.textSecondary} size={16} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Type tabs */}
      <View style={[styles.typeTabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.typeTab, filter === f && { borderBottomColor: f === 'income' ? ACCENT.green : f === 'expense' ? ACCENT.red : ACCENT.blue, borderBottomWidth: 2 }]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.typeTabText, { color: filter === f ? (f === 'income' ? ACCENT.green : f === 'expense' ? ACCENT.red : colors.textPrimary) : colors.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter chips */}
      <View style={[styles.catBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.catChip, { backgroundColor: !catFilter ? colors.inputBackground : colors.surface, borderColor: colors.border }]}
            onPress={() => setCatFilter('')}>
            <Text style={[styles.catChipText, { color: !catFilter ? ACCENT.blue : colors.textSecondary, fontWeight: !catFilter ? '700' : '500' }]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catChip, { backgroundColor: catFilter === c ? CATEGORY_COLORS[c] : colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setCatFilter(catFilter === c ? '' : c)}>
              <View style={[styles.catChipDot, { backgroundColor: CATEGORY_COLORS[c] }]} />
              <Text style={[styles.catChipText, { color: catFilter === c ? '#fff' : colors.textPrimary, fontWeight: catFilter === c ? '600' : '500' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}>
        {transactions.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No transactions found</Text>
        ) : (
          transactions.map((t) => <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />)
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

            {/* Date picker */}
            <TouchableOpacity
              style={[styles.input, styles.pickerBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}>
              <Calendar color={colors.textSecondary} size={16} />
              <Text style={[styles.pickerText, { color: colors.textPrimary }]}>{date}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(date)}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 8, gap: 8, borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 4 },
  typeTabs: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  typeTab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  typeTabText: { fontSize: 14, fontWeight: '600' },
  catBar: {
    paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1,
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    borderWidth: 1, marginRight: 6,
  },
  catChipDot: { width: 8, height: 8, borderRadius: 4 },
  catChipText: { fontSize: 12 },
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
