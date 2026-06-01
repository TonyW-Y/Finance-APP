import { API_URL } from '@/constants';
import { Transaction, Budget, Goal, Subscription } from '@/types';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Transactions
export const getTransactions = (token: string): Promise<Transaction[]> =>
  request(`${API_URL}/transactions`, { headers: authHeaders(token) });

export const createTransaction = (token: string, data: Omit<Transaction, 'id'>): Promise<Transaction> =>
  request(`${API_URL}/transactions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

export const deleteTransaction = (token: string, id: string): Promise<void> =>
  request(`${API_URL}/transactions/${id}`, { method: 'DELETE', headers: authHeaders(token) });

// Budgets
export const getBudgets = (token: string): Promise<Budget[]> =>
  request(`${API_URL}/budgets`, { headers: authHeaders(token) });

export const createBudget = (token: string, data: { category: string; limit: number }): Promise<Budget> =>
  request(`${API_URL}/budgets`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

export const deleteBudget = (token: string, category: string): Promise<void> =>
  request(`${API_URL}/budgets/${category}`, { method: 'DELETE', headers: authHeaders(token) });

// Goals
export const getGoals = (token: string): Promise<Goal[]> =>
  request(`${API_URL}/goals`, { headers: authHeaders(token) });

export const createGoal = (token: string, data: Omit<Goal, 'id'>): Promise<Goal> =>
  request(`${API_URL}/goals`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

export const updateGoal = (token: string, id: string, data: Partial<Goal>): Promise<Goal> =>
  request(`${API_URL}/goals/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

export const deleteGoal = (token: string, id: string): Promise<void> =>
  request(`${API_URL}/goals/${id}`, { method: 'DELETE', headers: authHeaders(token) });

// Subscriptions
export const getSubscriptions = (token: string): Promise<Subscription[]> =>
  request(`${API_URL}/subscriptions`, { headers: authHeaders(token) });

export const createSubscription = (token: string, data: Omit<Subscription, 'id'>): Promise<Subscription> =>
  request(`${API_URL}/subscriptions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

export const deleteSubscription = (token: string, id: string): Promise<void> =>
  request(`${API_URL}/subscriptions/${id}`, { method: 'DELETE', headers: authHeaders(token) });

// Roast
export const getRoast = (token: string, transactions: Transaction[], budgets: Budget[]): Promise<string> =>
  request(`${API_URL}/roast`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ transactions, budgets }),
  }).then((data: any) => data.roast);

export const getWeeklyRoast = (token: string, summary: { totalSpent: number; topCategories: string[]; transactionCount: number }): Promise<string> =>
  request(`${API_URL}/weekly-roast`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ summary }),
  }).then((data: any) => data.roast);
