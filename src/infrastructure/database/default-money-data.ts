import { Category } from '@/src/domain/money/types';

export const defaultCategories: Category[] = [
  { id: 'food', name: 'Food', color: '#FF6B6B', icon: '🍔', type: 'expense' },
  { id: 'transport', name: 'Transport', color: '#4ECDC4', icon: '🚗', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', color: '#95E1D3', icon: '🎬', type: 'expense' },
  { id: 'shopping', name: 'Shopping', color: '#FFD93D', icon: '🛍️', type: 'expense' },
  { id: 'utilities', name: 'Utilities', color: '#6BCB77', icon: '💡', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', color: '#FF8B94', icon: '⚕️', type: 'expense' },
  { id: 'other-expense', name: 'Other', color: '#A8DADC', icon: '📌', type: 'expense' },
  { id: 'salary', name: 'Salary', color: '#4A90E2', icon: '💰', type: 'income' },
  { id: 'freelance', name: 'Freelance', color: '#F5A623', icon: '💻', type: 'income' },
  { id: 'investment', name: 'Investment', color: '#7ED321', icon: '📈', type: 'income' },
  { id: 'gift', name: 'Gift', color: '#BD10E0', icon: '🎁', type: 'income' },
  { id: 'other-income', name: 'Other', color: '#50E3C2', icon: '📌', type: 'income' },
];
