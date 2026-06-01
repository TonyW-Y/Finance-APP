import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { ACCENT } from '@/constants';

interface RoastCardProps {
  roast: string;
}

export function RoastCard({ roast }: RoastCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: ACCENT.roast + '66' }]}>
      <View style={styles.header}>
        <Flame color={ACCENT.roast} size={22} />
        <Text style={styles.headerText}>Chef's Judgement</Text>
      </View>
      <Text style={[styles.roastText, { color: colors.textPrimary }]}>{roast}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#C44D31',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '800',
    color: ACCENT.roast,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  roastText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
