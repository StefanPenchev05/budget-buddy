import { Category, Transaction } from '@/src/domain/money/types';
import { MoneyRepository } from '@/src/domain/money/repositories/money-repository';

export function initDatabase(): Promise<unknown>;
export function getCategories(): Promise<Category[]>;
export function getCategoriesByType(type: 'expense' | 'income'): Promise<Category[]>;
export function addCategory(category: Category): Promise<void>;
export function deleteCategory(id: string): Promise<void>;
export function addTransaction(transaction: Transaction): Promise<void>;
export function getTransactions(limit?: number): Promise<Transaction[]>;
export function getTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]>;
export function getTransactionsByCategory(categoryId: string): Promise<Transaction[]>;
export function updateTransaction(transaction: Transaction): Promise<void>;
export function deleteTransaction(id: string): Promise<void>;
export function getTransactionStats(
  startDate: string,
  endDate: string,
): Promise<{ totalIncome: number; totalExpense: number }>;
export function getAllTimeStats(): Promise<{
  totalIncome: number;
  totalExpense: number;
}>;
export const moneyRepository: MoneyRepository;
