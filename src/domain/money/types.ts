export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income'; // 'expense' for debts/spending, 'income' for pluses/earnings
}

export interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO format
  type: 'expense' | 'income';
  isRecurring?: boolean; // New: for recurring transactions
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // New
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  month: string; // YYYY-MM format
}

export interface RecurringTransaction {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  type: 'expense' | 'income';
  active: boolean;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number; // income - expense
  debt: number; // total expenses (money owed/spent)
  plus: number; // total income (money earned)
}

