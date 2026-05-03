import { Category, Summary, Transaction } from './types';

export type CategoryTotal = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
};

export type MoneyPeriod = 'month' | 'year' | 'all';

export function calculateSummary(transactions: Transaction[]): Summary {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    debt: totalExpense,
    plus: totalIncome,
  };
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: MoneyPeriod,
  now = new Date(),
) {
  if (period === 'all') {
    return transactions;
  }

  const startDate =
    period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);

  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= now;
  });
}

export function getCategoryTotals(
  transactions: Transaction[],
  categories: Category[],
  type: Transaction['type'],
): CategoryTotal[] {
  const total = transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalsByCategory = transactions
    .filter((transaction) => transaction.type === type)
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.categoryId] =
        (totals[transaction.categoryId] ?? 0) + transaction.amount;
      return totals;
    }, {});

  return Object.entries(totalsByCategory)
    .map(([categoryId, amount]) => {
      const category = categories.find((item) => item.id === categoryId);

      return {
        categoryId,
        name: category?.name ?? 'Unknown',
        color: category?.color ?? '#8A94A6',
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function getCurrentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
