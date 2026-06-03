import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, X, Trash2, ChevronDown, Repeat } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getSubscriptions, createSubscription, deleteSubscription } from '@/lib/api';
import { ACCENT } from '@/constants';
import { Subscription, Frequency } from '@/types';

const FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'monthly', 'yearly'];
const SUB_COLORS = ['#F4845F', '#4A90D9', '#17A2B8', '#F5B731', '#1D9E75', '#E91E63', '#00BCD4'];

function monthlyAmount(sub: Subscription) {
  if (sub.frequency === 'weekly') return sub.amount * 4.33;
  if (sub.frequency === 'biweekly') return sub.amount * 2.167;
  if (sub.frequency === 'yearly') return sub.amount / 12;
  return sub.amount;
}

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try { setSubscriptions(await getSubscriptions(token)); } catch {}
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => { setName(''); setAmount(''); setFrequency('monthly'); setError(''); };

  const handleAdd = async () => {
    if (!name.trim()) return setError('Service name is required');
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return setError('Enter a valid amount');
    if (!token) return;
    try {
      await createSubscription(token, { name: name.trim(), amount: n, frequency });
      await load();
      setModalVisible(false);
      resetForm();
    } catch (e: any) {
      setError(e.message || 'Failed to add subscription');
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try { await deleteSubscription(token, id); setSubscriptions((prev) => prev.filter((s) => s.id !== id)); } catch {}
  };

  const totalMonthly = subscriptions.reduce((s, sub) => s + monthlyAmount(sub), 0);
  const totalYearly = totalMonthly * 12;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Subscriptions"
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
        {subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Repeat color={colors.textSecondary} size={40} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No subscriptions</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap + to add a subscription</Text>
          </View>
        ) : (
          <>
            {subscriptions.map((sub, i) => {
              const dotColor = SUB_COLORS[i % SUB_COLORS.length];
              return (
                <View key={sub.id} style={[styles.subCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.subRow}>
                    <View style={[styles.subDot, { backgroundColor: dotColor }]} />
                    <View style={styles.subInfo}>
                      <Text style={[styles.subName, { color: colors.textPrimary }]}>{sub.name}</Text>
                      <Text style={[styles.subFreq, { color: colors.textSecondary }]}>
                        {sub.frequency.charAt(0).toUpperCase() + sub.frequency.slice(1)} &middot; ${sub.amount.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={[styles.subMonthly, { color: colors.textPrimary }]}>
                      ${monthlyAmount(sub).toFixed(2)}/mo
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(sub.id)} hitSlop={8}>
                      <Trash2 color={ACCENT.red} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={[styles.totalsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Monthly Total</Text>
                <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>${totalMonthly.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Yearly Total</Text>
                <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>${totalYearly.toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add Subscription</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X color={colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Service name (e.g. Netflix)" placeholderTextColor={colors.textSecondary}
              value={name} onChangeText={setName} />

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Amount ($)" placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />

            <TouchableOpacity
              style={[styles.input, styles.pickerBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => setShowFreqPicker(!showFreqPicker)}>
              <Text style={[styles.pickerText, { color: colors.textPrimary }]}>
                {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
              </Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>

            {showFreqPicker && (
              <View style={[styles.dropdown, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                {FREQUENCIES.map((f) => (
                  <TouchableOpacity key={f} style={styles.dropdownOption} onPress={() => { setFrequency(f); setShowFreqPicker(false); }}>
                    <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: ACCENT.blue }]} onPress={handleAdd}>
              <Text style={styles.submitText}>Add Subscription</Text>
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
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  addBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  subCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  subDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  subInfo: { flex: 1 },
  subName: { fontSize: 14, fontWeight: '500' },
  subFreq: { fontSize: 12, marginTop: 1 },
  subMonthly: { fontSize: 14, fontWeight: '600' },
  totalsCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13 },
  totalAmount: { fontSize: 15, fontWeight: '700' },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  input: { height: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerText: { flex: 1, fontSize: 14 },
  dropdown: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownText: { fontSize: 14 },
  errorText: { color: '#D85A30', fontSize: 13 },
  submitBtn: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
