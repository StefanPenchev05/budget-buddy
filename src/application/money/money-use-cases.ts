import { calculateSummary } from '@/src/domain/money/analytics';
import { Category, Transaction } from '@/src/domain/money/types';
import { MoneyRepository } from '@/src/domain/money/repositories/money-repository';

export function createMoneyUseCases(repository: MoneyRepository) {
  return {
    initialize: () => repository.initialize(),
    loadCategories: () => repository.getCategories(),
    addCategory: async (category: Category) => {
      await repository.addCategory(category);
      return repository.getCategories();
    },
    deleteCategory: async (id: string) => {
      await repository.deleteCategory(id);
      return repository.getCategories();
    },
    loadTransactions: () => repository.getTransactions(),
    addTransaction: async (transaction: Transaction) => {
      await repository.addTransaction(transaction);
      return repository.getTransactions();
    },
    updateTransaction: async (transaction: Transaction) => {
      await repository.updateTransaction(transaction);
      return repository.getTransactions();
    },
    deleteTransaction: async (id: string) => {
      await repository.deleteTransaction(id);
      return repository.getTransactions();
    },
    loadTransactionsByCategory: (categoryId: string) =>
      repository.getTransactionsByCategory(categoryId),
    calculateAllTimeSummary: async () => {
      const transactions = await repository.getTransactions();
      return calculateSummary(transactions);
    },
  };
}

export type MoneyUseCases = ReturnType<typeof createMoneyUseCases>;
