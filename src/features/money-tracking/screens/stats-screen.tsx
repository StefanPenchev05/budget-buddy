import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import {
  filterTransactionsByPeriod,
  getCategoryTotals,
  MoneyPeriod,
} from '@/src/domain/money/analytics';
import { formatCurrency } from '@/src/shared/formatting/formatters';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

export default function StatsScreen() {
  const { transactions, categories } = useMoneyTracker();
  const [timeframe, setTimeframe] = useState<MoneyPeriod>('month');

  const filteredTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, timeframe),
    [transactions, timeframe],
  );

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      topCategories: getCategoryTotals(filteredTransactions, categories, 'expense').slice(0, 5),
      topIncomeCategories: getCategoryTotals(filteredTransactions, categories, 'income').slice(0, 3),
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions, categories]);

  const averageTransaction =
    stats.transactionCount > 0 ? stats.expenses / stats.transactionCount : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {(['month', 'year', 'all'] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[
              styles.timeframeButton,
              timeframe === tf && styles.timeframeButtonActive,
            ]}
            onPress={() => setTimeframe(tf)}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                timeframe === tf && styles.timeframeButtonTextActive,
              ]}
            >
              {tf === 'month' ? 'Month' : tf === 'year' ? 'Year' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards - Improved */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { borderLeftColor: '#4CAF50', borderLeftWidth: 4 }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
            {formatCurrency(stats.income)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: '#FF3B30', borderLeftWidth: 4 }]}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryAmount, { color: '#FF3B30' }]}>
            {formatCurrency(stats.expenses)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: stats.balance >= 0 ? '#34C759' : '#FF3B30', borderLeftWidth: 4 }]}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: stats.balance >= 0 ? '#34C759' : '#FF3B30' },
            ]}
          >
            {formatCurrency(stats.balance)}
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg. Transaction</Text>
            <Text style={styles.metricValue}>{formatCurrency(averageTransaction)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Count</Text>
            <Text style={styles.metricValue}>{stats.transactionCount}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Savings Rate</Text>
            <Text style={styles.metricValue}>
              {stats.income > 0
                ? `${((stats.balance / stats.income) * 100).toFixed(1)}%`
                : '0%'}
            </Text>
          </View>
        </View>
      </View>

      {/* Expense Distribution Chart */}
      {stats.topCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>

          <View style={styles.chartContainer}>
            {stats.topCategories.map((item, index) => (
              <View key={item.categoryId} style={styles.chartItem}>
                <View style={styles.chartItemHeader}>
                  <View style={styles.chartItemLabel}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.chartItemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.chartItemPercent}>{item.percentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartItemAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Income Sources Chart */}
      {stats.topIncomeCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Sources</Text>

          <View style={styles.chartContainer}>
            {stats.topIncomeCategories.map((item) => (
              <View key={item.categoryId} style={styles.chartItem}>
                <View style={styles.chartItemHeader}>
                  <View style={styles.chartItemLabel}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.chartItemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.chartItemPercent}>{item.percentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartItemAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    ...shadows.card,
  },
  timeframeButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  timeframeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.textMuted,
  },
  timeframeButtonTextActive: {
    color: palette.surface,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'flex-start',
    ...shadows.card,
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: 6,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.md,
    color: palette.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  metricLabel: {
    fontSize: 11,
    color: palette.textMuted,
    marginBottom: spacing.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: palette.primary,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  chartItem: {
    marginBottom: spacing.xl,
  },
  chartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  chartItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
    flex: 1,
  },
  chartItemPercent: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.primary,
  },
  chartBar: {
    height: 8,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartItemAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
    textAlign: 'right',
  },
  spacer: {
    height: 40,
  },
});
