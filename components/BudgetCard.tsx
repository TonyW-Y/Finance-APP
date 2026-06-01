import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORY_COLORS, ACCENT } from '@/constants';
import { Budget } from '@/types';

interface BudgetCardProps {
  budget: Budget;
}

function getBarColor(pct: number) {
  if (pct >= 90) return ACCENT.red;
  if (pct >= 70) return ACCENT.yellow;
  return ACCENT.green;
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const { colors } = useTheme();
  const pct = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
  const barColor = getBarColor(pct);
  const catColor = CATEGORY_COLORS[budget.category] || '#8A8A8A';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: catColor }]} />
        <Text style={[styles.category, { color: colors.textPrimary }]}>{budget.category}</Text>
        <Text style={[styles.amounts, { color: colors.textSecondary }]}>
          <Text style={{ color: barColor }}>${budget.spent.toFixed(0)}</Text>
          {' / $'}{budget.limit.toFixed(0)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.pctText, { color: barColor }]}>{pct.toFixed(0)}% used</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  category: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  amounts: {
    fontSize: 13,
    fontWeight: '500',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
