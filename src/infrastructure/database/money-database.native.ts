import * as SQLite from 'expo-sqlite';
import { Category, Transaction } from '@/src/domain/money/types';
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

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
  `);

  // Insert default categories if none exist
  await insertDefaultCategories();
  // Insert mock data if no transactions exist
  await insertMockData();

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

async function insertMockData() {
  if (!db) return;

  try {
    // Check if transactions already exist
    const existing = await db.getFirstAsync('SELECT COUNT(*) as count FROM transactions');
    if ((existing as any)?.count > 0) return;

    const today = new Date();
    const mockTransactions: Transaction[] = [];
    // Generate 150 mock transactions across the last 90 days
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];

      const isIncome = Math.random() < 0.2;
      
      let categoryId: string;
      let amount: number;
      let description: string;

      if (isIncome) {
        const incomeCategories = ['salary', 'freelance', 'investment', 'gift', 'other-income'];
        categoryId = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
        
        if (categoryId === 'salary') {
          amount = 3000 + Math.random() * 1000;
          description = 'Monthly salary';
        } else if (categoryId === 'freelance') {
          amount = 100 + Math.random() * 500;
          description = 'Freelance project payment';
        } else if (categoryId === 'investment') {
          amount = 50 + Math.random() * 200;
          description = 'Investment returns';
        } else if (categoryId === 'gift') {
          amount = 20 + Math.random() * 100;
          description = 'Gift from friend';
        } else {
          amount = 50 + Math.random() * 200;
          description = 'Other income';
        }
      } else {
        const expenseCategories = ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'healthcare', 'other-expense'];
        categoryId = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        
        if (categoryId === 'food') {
          amount = 5 + Math.random() * 40;
          const descriptions = ['Lunch at restaurant', 'Groceries', 'Dinner out', 'Coffee shop', 'Breakfast', 'Snacks'];
          description = descriptions[Math.floor(Math.random() * descriptions.length)];
        } else if (categoryId === 'transport') {
          amount = 3 + Math.random() * 25;
          const descriptions = ['Gas', 'Uber ride', 'Bus ticket', 'Parking', 'Car maintenance'];
          description = descriptions[Math.floor(Math.random() * descriptions.length)];
        } else if (categoryId === 'entertainment') {
          amount = 5 + Math.random() * 50;
          const descriptions = ['Movie tickets', 'Concert', 'Game purchase', 'Streaming service', 'Book'];
          description = descriptions[Math.floor(Math.random() * descriptions.length)];
        } else if (categoryId === 'shopping') {
          amount = 10 + Math.random() * 150;
          const descriptions = ['Clothes', 'Shoes', 'Electronics', 'Home items', 'Gifts'];
          description = descriptions[Math.floor(Math.random() * descriptions.length)];
        } else if (categoryId === 'utilities') {
          amount = 20 + Math.random() * 100;
          const descriptions = ['Electricity bill', 'Water bill', 'Internet', 'Phone bill', 'Gas bill'];
          description = descriptions[Math.floor(Math.random() * descriptions.length)];
        } else if (categoryId === 'healthcare') {
          amount = 20 + Math.random() * 200;
          const descriptions = ['Doctor visit', 'Pharmacy', 'Dental', 'Gym membership', 'Health supplement'];
          description = descriptions[Math.floor(Math.random() * descriptions.length)];
        } else {
          amount = 5 + Math.random() * 50;
          description = 'Other expense';
        }
      }

      mockTransactions.push({
        id: `mock_${Date.now()}_${i}`,
        categoryId,
        amount: Math.round(amount * 100) / 100,
        description,
        date: dateStr,
        type: isIncome ? 'income' : 'expense',
      });
    }

    // Insert all mock transactions
    for (const transaction of mockTransactions) {
      await db.runAsync(
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

    console.log('Mock data inserted successfully');
  } catch (error) {
    console.error('Error inserting mock data:', error);
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
  getTransactionStats,
  getAllTimeStats,
};
