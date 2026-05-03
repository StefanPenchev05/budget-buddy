import { Budget, Category, Transaction } from '@/src/domain/money/types';

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
}

export interface MoneyRepository {
  initialize(): Promise<unknown>;
  getCategories(): Promise<Category[]>;
  getCategoriesByType(type: Category['type']): Promise<Category[]>;
  addCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  addTransaction(transaction: Transaction): Promise<void>;
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  getTransactionsByCategory(categoryId: string): Promise<Transaction[]>;
  updateTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  getBudgets(month?: string): Promise<Budget[]>;
  upsertBudget(budget: Budget): Promise<void>;
  deleteBudget(id: string): Promise<void>;
  getTransactionStats(startDate: string, endDate: string): Promise<TransactionStats>;
  getAllTimeStats(): Promise<TransactionStats>;
}
