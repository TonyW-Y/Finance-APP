import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ACCENT } from '@/constants';

interface BarChartProps {
  data: { label: string; value: number; isCurrentMonth?: boolean }[];
}

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  let nice: number;
  if (residual <= 1) nice = 1;
  else if (residual <= 2) nice = 2;
  else if (residual <= 5) nice = 5;
  else nice = 10;
  return Math.ceil(value / (nice * magnitude)) * (nice * magnitude);
}

function getTicks(max: number, count: number = 4): number[] {
  const step = max / count;
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(Math.round(i * step));
  }
  return ticks;
}

export function BarChart({ data }: BarChartProps) {
  const { colors } = useTheme();
  const chartHeight = 150;
  const barWidth = 32;
  const maxVal = niceMax(Math.max(...data.map((d) => d.value), 0));
  const ticks = getTicks(maxVal);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.chart}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {ticks.map((t, i) => (
            <Text key={i} style={[styles.yLabel, { color: colors.textSecondary }]}>
              ${t >= 1000 ? `${(t / 1000).toFixed(t % 1000 === 0 ? 0 : 1)}k` : t}
            </Text>
          ))}
        </View>

        {/* Bars with grid lines */}
        <View style={styles.chartArea}>
          {ticks.map((_, i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                {
                  top: (i / ticks.length) * chartHeight,
                  backgroundColor: colors.border,
                },
              ]}
            />
          ))}
          <View style={styles.barsRow}>
            {data.map((item, i) => {
              const barHeight = Math.max((item.value / maxVal) * chartHeight, 2);
              const barColor = item.isCurrentMonth ? '#5599FF' : ACCENT.blue;
              return (
                <View key={i} style={[styles.barColumn, { width: barWidth }]}>
                  <View style={[styles.barTrack, { height: chartHeight }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                          opacity: item.isCurrentMonth ? 1 : 0.5,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginTop: 4 },
  chart: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  yAxis: {
    width: 36,
    height: 150,
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  yLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
  },
  chartArea: {
    height: 150,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.2,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 2,
    height: 150,
  },
  barColumn: {
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
});
