import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
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

function getTicks(max: number): number[] {
  const ticks: number[] = [];
  const step = max / 4;
  for (let i = 0; i <= 4; i++) {
    ticks.push(Math.round(i * step));
  }
  return ticks;
}

function formatValue(n: number): string {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val % 1 === 0 ? `${val}k` : `${val.toFixed(1)}k`;
  }
  return String(n);
}

const Y_AXIS_WIDTH = 48;
const GAP = 6;
const MIN_BAR_WIDTH = 32;

export function BarChart({ data }: BarChartProps) {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const chartHeight = Math.min(Math.max(screenHeight * 0.22, 120), 320);
  const maxVal = niceMax(Math.max(...data.map((d) => d.value), 0));
  const ticks = getTicks(maxVal);

  const availableWidth = screenWidth - Y_AXIS_WIDTH - 8;
  const totalGaps = (data.length - 1) * GAP;
  const fits = data.length * MIN_BAR_WIDTH + totalGaps <= availableWidth;
  const barWidth = fits
    ? Math.floor((availableWidth - totalGaps) / data.length)
    : MIN_BAR_WIDTH;
  const chartContentWidth = fits ? availableWidth : data.length * barWidth + totalGaps;

  return (
    <View style={[styles.container, { minHeight: chartHeight + 24 }]}>
      {/* Y-axis — fixed outside scroll */}
      <View style={[styles.yAxis, { height: chartHeight, width: Y_AXIS_WIDTH }]}>
        {[...ticks].reverse().map((t, i) => (
          <Text key={i} style={[styles.yLabel, { color: colors.textSecondary }]}>
            ${formatValue(t)}
          </Text>
        ))}
      </View>

      {/* Scrollable bar area */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={{ width: chartContentWidth }}
      >
        <View style={[styles.chartArea, { height: chartHeight, width: chartContentWidth }]}>
          {[...ticks].reverse().map((_, i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                {
                  bottom: (i / (ticks.length - 1)) * chartHeight,
                  backgroundColor: colors.border,
                },
              ]}
            />
          ))}
          <View style={[styles.barsRow, { height: chartHeight, gap: GAP }]}>
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
                  <Text
                    numberOfLines={1}
                    style={[styles.barLabel, { color: colors.textSecondary }]}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: -8,
  },
  scroll: {
    flex: 1,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  yLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
  },
  chartArea: {
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.15,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
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
