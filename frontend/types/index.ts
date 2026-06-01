export type TransactionType = 'income' | 'expense';
export type Category =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Entertainment'
  | 'Health'
  | 'Shopping'
  | 'Salary'
  | 'Freelance'
  | 'Other';
export type Frequency = 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

export interface Budget {
  id?: string;
  category: Category;
  limit: number;
  spent: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

export interface User {
  email: string;
}

export interface ThemeColors {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  inputBackground: string;
}
