import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({ title, rightElement }: ScreenHeaderProps) {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: 14 + insets.top }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.right}>
        {rightElement}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {isDark ? <Sun color={colors.textSecondary} size={20} /> : <Moon color={colors.textSecondary} size={20} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    padding: 4,
  },
});
