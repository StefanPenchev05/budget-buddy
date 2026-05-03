import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { getCategoryTotals, getCurrentMonthKey } from '@/src/domain/money/analytics';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { formatCurrency } from '@/src/shared/formatting/formatters';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

export function BudgetCircle() {
  const { transactions, categories } = useMoneyTracker();

  const { categorySpending, totalSpending } = useMemo(() => {
    const currentMonth = getCurrentMonthKey();
    const monthlyExpenses = transactions.filter(
      (transaction) =>
        transaction.type === 'expense' && transaction.date.startsWith(currentMonth),
    );

    return {
      categorySpending: getCategoryTotals(monthlyExpenses, categories, 'expense'),
      totalSpending: monthlyExpenses.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      ),
    };
  }, [transactions, categories]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget Overview</Text>
        <Text style={styles.subtitle}>This Month</Text>
      </View>

      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          <View style={styles.centerContent}>
            <Text style={styles.totalLabel}>Total Spent</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalSpending)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.breakdown}>
        {categorySpending.length > 0 ? (
          categorySpending.map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <View
                  style={[styles.breakdownColor, { backgroundColor: item.color }]}
                />
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownName}>{item.name}</Text>
                  <Text style={styles.breakdownAmount}>{formatCurrency(item.amount)}</Text>
                </View>
              </View>
              <View style={styles.percentageContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.percentageText}>{item.percentage.toFixed(0)}%</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses this month</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  circle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 10,
    borderColor: palette.primarySoft,
  },
  centerContent: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 25,
    fontWeight: '900',
    color: palette.text,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  breakdownColor: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownName: {
    fontSize: 13,
    color: palette.text,
    fontWeight: '700',
  },
  breakdownAmount: {
    fontSize: 11,
    color: palette.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  percentageContainer: {
    width: 80,
    alignItems: 'flex-end',
    gap: 4,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textMuted,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '600',
  },
});
