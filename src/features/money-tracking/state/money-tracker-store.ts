import { create } from 'zustand';
import { Budget, Category, Transaction, Summary } from '@/src/domain/money/types';
import { MoneyUseCases } from '@/src/application/money/money-use-cases';

interface MoneyTrackerState {
  // State
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  summary: Summary;
  isLoading: boolean;
  initialize: () => Promise<void>;

  // Category actions
  loadCategories: () => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Transaction actions
  loadTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loadTransactionsByCategory: (categoryId: string) => Promise<Transaction[]>;

  // Budget actions
  loadBudgets: (month?: string) => Promise<void>;
  upsertBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string, month?: string) => Promise<void>;

  // Summary actions
  calculateSummary: () => Promise<void>;
  getSummary: () => Summary;
}

export function createMoneyTrackerStore(moneyUseCases: MoneyUseCases) {
  return create<MoneyTrackerState>((set, get) => ({
    categories: [],
    transactions: [],
    budgets: [],
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      debt: 0,
      plus: 0,
    },
    isLoading: false,

    initialize: async () => {
      try {
        set({ isLoading: true });
        await moneyUseCases.initialize();
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [categories, transactions, budgets, summary] = await Promise.all([
          moneyUseCases.loadCategories(),
          moneyUseCases.loadTransactions(),
          moneyUseCases.loadBudgets(currentMonth),
          moneyUseCases.calculateAllTimeSummary(),
        ]);
        set({ categories, transactions, budgets, summary });
      } catch (error) {
        console.error('Error initializing money tracker:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    loadCategories: async () => {
      try {
        set({ isLoading: true });
        const categories = await moneyUseCases.loadCategories();
        set({ categories });
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    addCategory: async (category) => {
      try {
        set({ isLoading: true });
        const categories = await moneyUseCases.addCategory(category);
        set({ categories });
      } catch (error) {
        console.error('Error adding category:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    deleteCategory: async (id) => {
      try {
        set({ isLoading: true });
        const categories = await moneyUseCases.deleteCategory(id);
        const transactions = get().transactions.filter(
          (transaction) => transaction.categoryId !== id,
        );
        set({ categories, transactions });
        await get().calculateSummary();
      } catch (error) {
        console.error('Error deleting category:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    loadTransactions: async () => {
      try {
        set({ isLoading: true });
        const transactions = await moneyUseCases.loadTransactions();
        set({ transactions });
        await get().calculateSummary();
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    addTransaction: async (transaction) => {
      try {
        set({ isLoading: true });
        const transactions = await moneyUseCases.addTransaction(transaction);
        set({ transactions });
        await get().calculateSummary();
      } catch (error) {
        console.error('Error adding transaction:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    updateTransaction: async (transaction) => {
      try {
        set({ isLoading: true });
        const transactions = await moneyUseCases.updateTransaction(transaction);
        set({ transactions });
        await get().calculateSummary();
      } catch (error) {
        console.error('Error updating transaction:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    deleteTransaction: async (id) => {
      try {
        set({ isLoading: true });
        const transactions = await moneyUseCases.deleteTransaction(id);
        set({ transactions });
        await get().calculateSummary();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    loadTransactionsByCategory: async (categoryId) => {
      try {
        const transactions =
          await moneyUseCases.loadTransactionsByCategory(categoryId);
        return transactions;
      } catch (error) {
        console.error('Error loading transactions by category:', error);
        return [];
      }
    },

    loadBudgets: async (month) => {
      try {
        set({ isLoading: true });
        const budgets = await moneyUseCases.loadBudgets(month);
        set({ budgets });
      } catch (error) {
        console.error('Error loading budgets:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    upsertBudget: async (budget) => {
      try {
        set({ isLoading: true });
        const budgets = await moneyUseCases.upsertBudget(budget);
        set({ budgets });
      } catch (error) {
        console.error('Error saving budget:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    deleteBudget: async (id, month) => {
      try {
        set({ isLoading: true });
        const budgets = await moneyUseCases.deleteBudget(id, month);
        set({ budgets });
      } catch (error) {
        console.error('Error deleting budget:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    calculateSummary: async () => {
      try {
        const summary = await moneyUseCases.calculateAllTimeSummary();
        set({ summary });
      } catch (error) {
        console.error('Error calculating summary:', error);
      }
    },

    getSummary: () => get().summary,
  }));
}
