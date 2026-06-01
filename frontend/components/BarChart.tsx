import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ACCENT } from '@/constants';

interface BarChartProps {
  data: { label: string; value: number; isCurrentMonth?: boolean }[];
}

export function BarChart({ data }: BarChartProps) {
  const { colors } = useTheme();
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 120;

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {data.map((item, i) => {
          const barHeight = Math.max((item.value / maxVal) * chartHeight, 4);
          const barColor = item.isCurrentMonth ? ACCENT.blue : colors.border === '#2C2C2C' ? '#3A4A5C' : '#B0C4DE';
          return (
            <View key={i} style={styles.barColumn}>
              <View style={[styles.barTrack, { height: chartHeight }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
  },
  barLabel: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
});
