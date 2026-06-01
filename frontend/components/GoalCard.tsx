import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { ACCENT } from '@/constants';
import { Goal } from '@/types';

interface GoalCardProps {
  goal: Goal;
  onAddMoney: (id: string, amount: number) => void;
}

export function GoalCard({ goal, onAddMoney }: GoalCardProps) {
  const { colors } = useTheme();
  const [addAmount, setAddAmount] = useState('');
  const pct = goal.target_amount > 0 ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100) : 0;

  const handleAdd = () => {
    const n = parseFloat(addAmount);
    if (n > 0) {
      onAddMoney(goal.id, n);
      setAddAmount('');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{goal.name}</Text>
        <Text style={[styles.pct, { color: ACCENT.green }]}>{pct.toFixed(0)}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: ACCENT.green }]} />
      </View>
      <View style={styles.amountsRow}>
        <Text style={[styles.saved, { color: colors.textSecondary }]}>
          Saved: <Text style={{ color: ACCENT.green }}>${goal.saved_amount.toFixed(2)}</Text>
        </Text>
        <Text style={[styles.target, { color: colors.textSecondary }]}>
          Target: ${goal.target_amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Add amount"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={addAmount}
          onChangeText={setAddAmount}
        />
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: ACCENT.green }]} onPress={handleAdd}>
          <Plus color="#fff" size={18} />
        </TouchableOpacity>
      </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  pct: {
    fontSize: 14,
    fontWeight: '700',
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
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saved: {
    fontSize: 13,
  },
  target: {
    fontSize: 13,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
