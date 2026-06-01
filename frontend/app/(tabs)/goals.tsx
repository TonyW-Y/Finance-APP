import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Plus, X, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { GoalCard } from '@/components/GoalCard';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/lib/api';
import { ACCENT } from '@/constants';
import { Goal } from '@/types';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try { setGoals(await getGoals(token)); } catch {}
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => { setName(''); setTargetAmount(''); setSavedAmount(''); setError(''); };

  const handleAdd = async () => {
    if (!name.trim()) return setError('Goal name is required');
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) return setError('Enter a valid target amount');
    const saved = parseFloat(savedAmount) || 0;
    if (!token) return;
    try {
      await createGoal(token, { name: name.trim(), targetAmount: target, savedAmount: saved });
      await load();
      setModalVisible(false);
      resetForm();
    } catch (e: any) {
      setError(e.message || 'Failed to create goal');
    }
  };

  const handleAddMoney = async (id: string, amount: number) => {
    if (!token) return;
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    try {
      const updated = await updateGoal(token, id, { savedAmount: goal.savedAmount + amount });
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await deleteGoal(token, id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Goals"
        rightElement={
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: ACCENT.green }]} onPress={() => setModalVisible(true)}>
            <Plus color="#fff" size={18} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}>
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No savings goals</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap + to create a savings goal</Text>
          </View>
        ) : (
          goals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <View style={{ flex: 1 }}>
                <GoalCard goal={g} onAddMoney={handleAddMoney} />
              </View>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleDelete(g.id)}>
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
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>New Goal</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Goal name" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Target amount ($)" placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad" value={targetAmount} onChangeText={setTargetAmount} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Already saved ($) — optional" placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad" value={savedAmount} onChangeText={setSavedAmount} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: ACCENT.green }]} onPress={handleAdd}>
              <Text style={styles.submitText}>Create Goal</Text>
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
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  deleteBtn: { width: 36, height: 36, marginTop: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  input: { height: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  errorText: { color: '#D85A30', fontSize: 13 },
  submitBtn: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
