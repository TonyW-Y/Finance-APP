import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Flame, X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SummaryCard } from '@/components/SummaryCard';
import { BarChart } from '@/components/BarChart';
import { TransactionItem } from '@/components/TransactionItem';
import { RoastCard } from '@/components/RoastCard';
import { getTransactions, getSubscriptions, getBudgets, getWeeklyRoast } from '@/lib/api';
import { ACCENT } from '@/constants';
import { Transaction, Subscription, Budget } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function getYearData(transactions: Transaction[]) {
  const now = new Date();
  const year = now.getFullYear();
  return MONTHS.map((label, m) => {
    const total = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === m && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return { label, value: total, isCurrentMonth: m === now.getMonth() };
  });
}

function monthlySubCost(subs: Subscription[]) {
  return subs.reduce((sum, s) => {
    if (s.frequency === 'weekly') return sum + s.amount * 4.33;
    if (s.frequency === 'biweekly') return sum + s.amount * 2.167;
    if (s.frequency === 'yearly') return sum + s.amount / 12;
    return sum + s.amount;
  }, 0);
}

export default function OverviewScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentRoast, setCurrentRoast] = useState<string | null>(null);
  const [weeklyRoast, setWeeklyRoast] = useState<string | null>(null);
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [txns, subs, bdgs] = await Promise.all([
        getTransactions(token),
        getSubscriptions(token),
        getBudgets(token),
      ]);
      setTransactions(txns);
      setSubscriptions(subs);
      setBudgets(bdgs);
    } catch {}
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleWeeklyRoast = async () => {
    if (!token) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTxns = transactions.filter((t) => new Date(t.date) >= weekAgo);
    const totalSpent = weekTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const categoryCounts: Record<string, number> = {};
    weekTxns.forEach((t) => {
      if (t.type === 'expense') {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + t.amount;
      }
    });
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    try {
      const roast = await getWeeklyRoast(token, {
        totalSpent,
        topCategories,
        transactionCount: weekTxns.length,
      });
      setWeeklyRoast(roast);
      setWeeklyModalVisible(true);
    } catch {}
  };

  const thisMonth = transactions.filter((t) => isThisMonth(t.date));
  const totalIncome = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const subCost = monthlySubCost(subscriptions);
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const chartData = getYearData(transactions);

  const fmt = (n: number) =>
    `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Overview" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}>
        {currentRoast && <RoastCard roast={currentRoast} />}

        <TouchableOpacity
          style={[styles.weeklyBtn, { backgroundColor: ACCENT.roast + '22', borderColor: ACCENT.roast + '44' }]}
          onPress={handleWeeklyRoast}>
          <Flame color={ACCENT.roast} size={18} />
          <Text style={[styles.weeklyBtnText, { color: ACCENT.roast }]}>Get Weekly Roast</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <SummaryCard label="Total Income" value={fmt(totalIncome)} accentColor={ACCENT.green} />
            <View style={{ width: 12 }} />
            <SummaryCard label="Total Expenses" value={fmt(totalExpenses)} accentColor={ACCENT.red} />
          </View>
          <View style={[styles.gridRow, { marginTop: 12 }]}>
            <SummaryCard
              label="Net Balance"
              value={`${netBalance >= 0 ? '+' : '-'}${fmt(netBalance)}`}
              accentColor={netBalance >= 0 ? ACCENT.green : ACCENT.red}
            />
            <View style={{ width: 12 }} />
            <SummaryCard label="Monthly Subs" value={fmt(subCost)} accentColor={ACCENT.blue} />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Spending</Text>
          <BarChart data={chartData} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          {recentTransactions.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No transactions yet</Text>
          ) : (
            recentTransactions.map((t) => <TransactionItem key={t.id} transaction={t} />)
          )}
        </View>
      </ScrollView>

      <Modal visible={weeklyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: ACCENT.roast + '66' }]}>
            <View style={styles.modalHeader}>
              <Flame color={ACCENT.roast} size={28} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Weekly Roast</Text>
              <TouchableOpacity onPress={() => setWeeklyModalVisible(false)}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.roastBody, { color: colors.textPrimary }]}>{weeklyRoast}</Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: ACCENT.roast }]}
              onPress={() => setWeeklyModalVisible(false)}>
              <Text style={styles.closeBtnText}>I Can Take It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  weeklyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  weeklyBtnText: { fontSize: 14, fontWeight: '700' },
  grid: {},
  gridRow: { flexDirection: 'row' },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
  },
  roastBody: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
