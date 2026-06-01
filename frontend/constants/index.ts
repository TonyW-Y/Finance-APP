import { Platform } from 'react-native';
import { Category } from '@/types';

const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }
  return 'http://localhost:8000';
};

export const API_URL = getApiUrl();

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Health',
  'Shopping',
  'Salary',
  'Freelance',
  'Other',
];

export const INCOME_CATEGORIES: Category[] = ['Salary', 'Freelance'];
export const EXPENSE_CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Health',
  'Shopping',
];
export const BOTH_CATEGORIES: Category[] = ['Other'];

export function getCategoriesForType(type: 'income' | 'expense'): Category[] {
  const base = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return [...base, ...BOTH_CATEGORIES];
}

export const CATEGORY_IS_EXPENSE: Record<Category, boolean> = {
  Food: true,
  Transport: true,
  Housing: true,
  Entertainment: true,
  Health: true,
  Shopping: true,
  Salary: false,
  Freelance: false,
  Other: true,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#F4845F',
  Transport: '#4A90D9',
  Housing: '#17A2B8',
  Entertainment: '#F5B731',
  Health: '#1D9E75',
  Shopping: '#E91E63',
  Salary: '#27AE60',
  Freelance: '#00BCD4',
  Other: '#8A8A8A',
};

export const ACCENT = {
  green: '#1D9E75',
  red: '#D85A30',
  blue: '#185FA5',
  yellow: '#BA7517',
  roast: '#C44D31',
};

export const DARK_THEME = {
  background: '#121212',
  surface: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#2C2C2C',
  inputBackground: '#2A2A2A',
};

export const LIGHT_THEME = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#121212',
  textSecondary: '#666666',
  border: '#E0E0E0',
  inputBackground: '#F0F0F0',
};
