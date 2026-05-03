import { Category, Transaction } from '@/src/domain/money/types';
import { MoneyRepository } from '@/src/domain/money/repositories/money-repository';
import { defaultCategories } from './default-money-data';

type WebStore = {
  categories: Category[];
  transactions: Transaction[];
};

const storageKey = 'money_tracker_web_store';

let store: WebStore = {
  categories: [...defaultCategories],
  transactions: [],
};

function getWebStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function readStore() {
  const storage = getWebStorage();
  const rawStore = storage?.getItem(storageKey);

  if (!rawStore) {
    return;
  }

  try {
    store = JSON.parse(rawStore) as WebStore;
  } catch {
    store = {
      categories: [...defaultCategories],
      transactions: [],
    };
  }
}

function writeStore() {
  getWebStorage()?.setItem(storageKey, JSON.stringify(store));
}

export async function initDatabase() {
  readStore();

  if (store.categories.length === 0) {
    store.categories = [...defaultCategories];
    writeStore();
  }
}

export async function getCategories(): Promise<Category[]> {
  readStore();
  return [...store.categories].sort((a, b) =>
    `${a.type}-${a.name}`.localeCompare(`${b.type}-${b.name}`),
  );
}

export async function getCategoriesByType(type: 'expense' | 'income'): Promise<Category[]> {
  const categories = await getCategories();
  return categories.filter((category) => category.type === type);
}

export async function addCategory(category: Category): Promise<void> {
  readStore();
  store.categories = [...store.categories, category];
  writeStore();
}

export async function deleteCategory(id: string): Promise<void> {
  readStore();
  store.categories = store.categories.filter((category) => category.id !== id);
  store.transactions = store.transactions.filter(
    (transaction) => transaction.categoryId !== id,
  );
  writeStore();
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  readStore();
  store.transactions = [transaction, ...store.transactions];
  writeStore();
}

export async function getTransactions(limit?: number): Promise<Transaction[]> {
  readStore();
  const transactions = [...store.transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return typeof limit === 'number' ? transactions.slice(0, limit) : transactions;
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  const transactions = await getTransactions();
  return transactions.filter(
    (transaction) => transaction.date >= startDate && transaction.date <= endDate,
  );
}

export async function getTransactionsByCategory(
  categoryId: string,
): Promise<Transaction[]> {
  const transactions = await getTransactions();
  return transactions.filter((transaction) => transaction.categoryId === categoryId);
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  readStore();
  store.transactions = store.transactions.map((item) =>
    item.id === transaction.id ? transaction : item,
  );
  writeStore();
}

export async function deleteTransaction(id: string): Promise<void> {
  readStore();
  store.transactions = store.transactions.filter((transaction) => transaction.id !== id);
  writeStore();
}

export async function getTransactionStats(
  startDate: string,
  endDate: string,
): Promise<{ totalIncome: number; totalExpense: number }> {
  const transactions = await getTransactionsByDateRange(startDate, endDate);
  return summarize(transactions);
}

export async function getAllTimeStats(): Promise<{
  totalIncome: number;
  totalExpense: number;
}> {
  const transactions = await getTransactions();
  return summarize(transactions);
}

function summarize(transactions: Transaction[]) {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === 'income') {
        totals.totalIncome += transaction.amount;
      } else {
        totals.totalExpense += transaction.amount;
      }

      return totals;
    },
    { totalIncome: 0, totalExpense: 0 },
  );
}

export const moneyRepository: MoneyRepository = {
  initialize: initDatabase,
  getCategories,
  getCategoriesByType,
  addCategory,
  deleteCategory,
  addTransaction,
  getTransactions,
  getTransactionsByDateRange,
  getTransactionsByCategory,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getAllTimeStats,
};
