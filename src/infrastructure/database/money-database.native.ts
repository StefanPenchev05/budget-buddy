import * as SQLite from 'expo-sqlite';
import { Budget, Category, Transaction } from '@/src/domain/money/types';
import { MoneyRepository } from '@/src/domain/money/repositories/money-repository';
import { defaultCategories } from './default-money-data';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('money_tracker.db');

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      limitAmount REAL NOT NULL,
      month TEXT NOT NULL,
      UNIQUE(categoryId, month),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
  `);

  // Insert default categories if none exist
  await insertDefaultCategories();

  return db;
}

async function insertDefaultCategories() {
  if (!db) return;

  try {
    for (const category of defaultCategories) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, color, icon, type) VALUES (?, ?, ?, ?, ?)',
        [category.id, category.name, category.color, category.icon, category.type]
      );
    }
  } catch (error) {
    console.error('Error inserting default categories:', error);
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

// Category operations
export async function getCategories(): Promise<Category[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    'SELECT id, name, color, icon, type FROM categories ORDER BY type, name'
  );
  return result as Category[];
}

export async function getCategoriesByType(type: 'expense' | 'income'): Promise<Category[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    'SELECT id, name, color, icon, type FROM categories WHERE type = ? ORDER BY name',
    [type]
  );
  return result as Category[];
}

export async function addCategory(category: Category): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO categories (id, name, color, icon, type) VALUES (?, ?, ?, ?, ?)',
    [category.id, category.name, category.color, category.icon, category.type]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

// Transaction operations
export async function addTransaction(transaction: Transaction): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO transactions (id, categoryId, amount, description, date, type) VALUES (?, ?, ?, ?, ?, ?)',
    [
      transaction.id,
      transaction.categoryId,
      transaction.amount,
      transaction.description,
      transaction.date,
      transaction.type,
    ]
  );
}

export async function getTransactions(limit?: number): Promise<Transaction[]> {
  const database = await getDatabase();
  let query = 'SELECT id, categoryId, amount, description, date, type FROM transactions ORDER BY date DESC';
  const params: any[] = [];

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  const result = await database.getAllAsync(query, params);
  return result as Transaction[];
}

export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    'SELECT id, categoryId, amount, description, date, type FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC',
    [startDate, endDate]
  );
  return result as Transaction[];
}

export async function getTransactionsByCategory(categoryId: string): Promise<Transaction[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    'SELECT id, categoryId, amount, description, date, type FROM transactions WHERE categoryId = ? ORDER BY date DESC',
    [categoryId]
  );
  return result as Transaction[];
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE transactions SET categoryId = ?, amount = ?, description = ?, date = ?, type = ? WHERE id = ?',
    [
      transaction.categoryId,
      transaction.amount,
      transaction.description,
      transaction.date,
      transaction.type,
      transaction.id,
    ]
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getBudgets(month?: string): Promise<Budget[]> {
  const database = await getDatabase();

  if (month) {
    const result = await database.getAllAsync(
      'SELECT id, categoryId, limitAmount, month FROM budgets WHERE month = ? ORDER BY categoryId',
      [month],
    );
    return result as Budget[];
  }

  const result = await database.getAllAsync(
    'SELECT id, categoryId, limitAmount, month FROM budgets ORDER BY month DESC, categoryId',
  );
  return result as Budget[];
}

export async function upsertBudget(budget: Budget): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `
    INSERT INTO budgets (id, categoryId, limitAmount, month)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(categoryId, month)
    DO UPDATE SET
      id = excluded.id,
      limitAmount = excluded.limitAmount
    `,
    [budget.id, budget.categoryId, budget.limitAmount, budget.month],
  );
}

export async function deleteBudget(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}

export async function getTransactionStats(
  startDate: string,
  endDate: string
): Promise<{ totalIncome: number; totalExpense: number }> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{
    income: number;
    expense: number;
  }>(
    `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions
    WHERE date BETWEEN ? AND ?
  `,
    [startDate, endDate]
  );

  return {
    totalIncome: result?.income || 0,
    totalExpense: result?.expense || 0,
  };
}

export async function getAllTimeStats(): Promise<{ totalIncome: number; totalExpense: number }> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{
    income: number;
    expense: number;
  }>(
    `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions
  `
  );

  return {
    totalIncome: result?.income || 0,
    totalExpense: result?.expense || 0,
  };
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
  getBudgets,
  upsertBudget,
  deleteBudget,
  getTransactionStats,
  getAllTimeStats,
};
