import React, { useEffect } from 'react';
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
import { BudgetCircle } from '@/src/features/money-tracking/components/budget-circle';
import { TransactionList } from '@/src/features/money-tracking/components/transaction-list';
import { formatCurrency } from '@/src/shared/formatting/formatters';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

export default function DashboardScreen() {
  const router = useRouter();
  const { summary, transactions, categories, isLoading, loadTransactions, calculateSummary, deleteTransaction } =
    useMoneyTracker();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary, transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const recentTransactions = transactions.slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Current Balance</Text>
        <Text style={styles.balance}>{formatCurrency(summary.balance)}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.income]}>
              {formatCurrency(summary.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryValue, styles.expense]}>
              {formatCurrency(summary.totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <BudgetCircle />
      </View>

      <View style={styles.transactionsSection}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.seeAllLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length > 0 ? (
          <TransactionList
            transactions={recentTransactions}
            categories={categories}
            isLoading={isLoading}
            groupByDate={false}
            onDeleteTransaction={deleteTransaction}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions</Text>
            <Text style={styles.emptySubtext}>Start adding transactions</Text>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
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
