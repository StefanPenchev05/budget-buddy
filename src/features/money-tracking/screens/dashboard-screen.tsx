import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { Transaction } from '@/src/domain/money/types';
import { BudgetCircle } from '@/src/features/money-tracking/components/budget-circle';
import { EditTransactionModal } from '@/src/features/money-tracking/components/edit-transaction-modal';
import { TransactionList } from '@/src/features/money-tracking/components/transaction-list';
import { formatCurrency } from '@/src/shared/formatting/formatters';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

export default function DashboardScreen() {
  const router = useRouter();
  const { summary, transactions, categories, isLoading, loadTransactions, calculateSummary, deleteTransaction, updateTransaction } =
    useMoneyTracker();
  const [refreshing, setRefreshing] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | undefined>();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        txDate.getMonth() === selectedMonth.getMonth() &&
        txDate.getFullYear() === selectedMonth.getFullYear()
      );
    });
  }, [transactions, selectedMonth]);

  const monthSummary = useMemo(() => {
    const income = monthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [monthTransactions]);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary, transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
    const today = new Date();
    
    // Don't allow going past current month
    if (nextMonth.getFullYear() > today.getFullYear() || 
        (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() > today.getMonth())) {
      return;
    }
    
    setSelectedMonth(nextMonth);
  };

  const monthLabel = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth =
    new Date().getMonth() === selectedMonth.getMonth() &&
    new Date().getFullYear() === selectedMonth.getFullYear();
  const canGoToNextMonth = (() => {
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
    const today = new Date();
    return !(nextMonth.getFullYear() > today.getFullYear() || 
             (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() > today.getMonth()));
  })();

  const recentTransactions = monthTransactions.slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
          <Text style={styles.monthNavArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.monthDisplay}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          {isCurrentMonth && <Text style={styles.currentBadge}>Today</Text>}
        </View>
        <TouchableOpacity 
          onPress={goToNextMonth} 
          style={[styles.monthNavButton, !canGoToNextMonth && styles.monthNavButtonDisabled]}
          disabled={!canGoToNextMonth}
        >
          <Text style={[styles.monthNavArrow, !canGoToNextMonth && styles.monthNavArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{isCurrentMonth ? 'Current Balance' : 'Balance'}</Text>
        <Text style={styles.balance}>{formatCurrency(monthSummary.balance)}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.income]}>
              {formatCurrency(monthSummary.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryValue, styles.expense]}>
              {formatCurrency(monthSummary.totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <BudgetCircle />
      </View>

      <View style={styles.transactionsSection}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.seeAllLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {monthTransactions.length > 0 ? (
          <TransactionList
            transactions={recentTransactions}
            categories={categories}
            isLoading={isLoading}
            groupByDate={false}
            onDeleteTransaction={deleteTransaction}
            onEditTransaction={setEditingTransaction}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions</Text>
            <Text style={styles.emptySubtext}>in {monthLabel}</Text>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
      <EditTransactionModal
        categories={categories}
        transaction={editingTransaction}
        visible={!!editingTransaction}
        onClose={() => setEditingTransaction(undefined)}
        onSave={updateTransaction}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
  },
  monthNavArrow: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.text,
  },
  monthNavArrowDisabled: {
    opacity: 0.5,
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: palette.text,
  },
  currentBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.primary,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  hero: {
    marginHorizontal: spacing.lg,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    ...shadows.card,
  },
  eyebrow: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  balance: {
    color: palette.text,
    fontSize: 36,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryLabel: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  income: {
    color: '#86EFAC',
  },
  expense: {
    color: '#FCA5A5',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  transactionsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.text,
  },
  seeAllLink: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: palette.textMuted,
  },
});
