import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORY_COLORS, ACCENT } from '@/constants';
import { Transaction, Category } from '@/types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

interface CatTotal {
  category: string;
  total: number;
  color: string;
}

export function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const { colors } = useTheme();
  const expenses = transactions.filter((t) => t.type === 'expense');
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  if (total === 0) return null;

  const catMap: Record<string, number> = {};
  expenses.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });

  const cats: CatTotal[] = Object.entries(catMap)
    .map(([category, total]) => ({
      category,
      total,
      color: CATEGORY_COLORS[category as Category] || '#8A8A8A',
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Category Breakdown</Text>

      {/* Stacked bar */}
      <View style={styles.stackedBar}>
        {cats.map((cat) => {
          const pct = (cat.total / total) * 100;
          return (
            <View
              key={cat.category}
              style={[styles.segment, { flex: pct, backgroundColor: cat.color }]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {cats.map((cat) => {
          const pct = ((cat.total / total) * 100);
          return (
            <View key={cat.category} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
              <Text style={[styles.legendCat, { color: colors.textPrimary }]}>{cat.category}</Text>
              <Text style={[styles.legendAmt, { color: colors.textSecondary }]}>
                ${cat.total.toFixed(0)}
              </Text>
              <Text style={[styles.legendPct, { color: colors.textSecondary }]}>
                {pct.toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  segment: {
    minWidth: 4,
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendCat: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  legendAmt: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  legendPct: {
    fontSize: 12,
    minWidth: 36,
    textAlign: 'right',
  },
});
