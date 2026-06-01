import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORY_COLORS, ACCENT } from '@/constants';
import { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const { colors } = useTheme();
  const catColor = CATEGORY_COLORS[transaction.category] || '#8A8A8A';
  const amountColor = transaction.type === 'income' ? ACCENT.green : ACCENT.red;
  const prefix = transaction.type === 'income' ? '+' : '-';

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.circle, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
        <Text style={[styles.circleText, { color: catColor }]}>
          {transaction.category.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.middle}>
        <Text style={[styles.description, { color: colors.textPrimary }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{formattedDate}</Text>
          <View style={[styles.badge, { backgroundColor: catColor + '22' }]}>
            <Text style={[styles.badgeText, { color: catColor }]}>{transaction.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.rightSide}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {prefix}${Math.abs(transaction.amount).toFixed(2)}
        </Text>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(transaction.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 color={colors.textSecondary} size={16} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  middle: {
    flex: 1,
    gap: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rightSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
