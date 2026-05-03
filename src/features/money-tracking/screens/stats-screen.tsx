import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { filterTransactionsByPeriod, getCategoryTotals, MoneyPeriod } from '@/src/domain/money/analytics';
import { Transaction } from '@/src/domain/money/types';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { formatCurrency } from '@/src/shared/formatting/formatters';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

type TrendPoint = {
  key: string;
  label: string;
  income: number;
  expenses: number;
  balance: number;
};

const timeframeLabels: Record<MoneyPeriod, string> = {
  month: 'Month',
  year: 'Year',
  all: 'All Time',
};

export default function StatsScreen() {
  const { transactions, categories } = useMoneyTracker();
  const [timeframe, setTimeframe] = useState<MoneyPeriod>('month');

  const filteredTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, timeframe),
    [transactions, timeframe],
  );

  const stats = useMemo(() => {
    const income = sumByType(filteredTransactions, 'income');
    const expenses = sumByType(filteredTransactions, 'expense');
    const balance = income - expenses;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;
    const burnRate = income > 0 ? Math.min((expenses / income) * 100, 100) : 0;

    return {
      income,
      expenses,
      balance,
      savingsRate,
      burnRate,
      averageExpense:
        filteredTransactions.length > 0 ? expenses / filteredTransactions.length : 0,
      transactionCount: filteredTransactions.length,
      topExpenseCategories: getCategoryTotals(
        filteredTransactions,
        categories,
        'expense',
      ).slice(0, 5),
      topIncomeCategories: getCategoryTotals(
        filteredTransactions,
        categories,
        'income',
      ).slice(0, 4),
      trend: buildTrend(filteredTransactions, timeframe),
    };
  }, [categories, filteredTransactions, timeframe]);

  const maxTrendValue = Math.max(
    1,
    ...stats.trend.flatMap((point) => [point.income, point.expenses]),
  );

  const highestExpense = stats.topExpenseCategories[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.eyebrow}>Analytics</Text>
            <Text style={styles.headerTitle}>{timeframeLabels[timeframe]} View</Text>
          </View>
          <View
            style={[
              styles.balanceBadge,
              {
                backgroundColor:
                  stats.balance >= 0 ? palette.incomeSoft : palette.expenseSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.balanceBadgeText,
                { color: stats.balance >= 0 ? palette.income : palette.expense },
              ]}
            >
              {stats.balance >= 0 ? 'Positive' : 'Negative'}
            </Text>
          </View>
        </View>

        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(stats.balance)}</Text>

        <View style={styles.cashFlowBar}>
          <View
            style={[
              styles.cashFlowFill,
              {
                width: `${Math.max(6, 100 - stats.burnRate)}%`,
                backgroundColor: palette.income,
              },
            ]}
          />
          <View
            style={[
              styles.cashFlowFill,
              {
                width: `${Math.max(6, stats.burnRate)}%`,
                backgroundColor: palette.expense,
              },
            ]}
          />
        </View>

        <View style={styles.headerMetrics}>
          <Metric label="Income" value={formatCurrency(stats.income)} color={palette.income} />
          <Metric label="Spent" value={formatCurrency(stats.expenses)} color={palette.expense} />
          <Metric
            label="Saved"
            value={`${stats.savingsRate.toFixed(1)}%`}
            color={palette.primary}
          />
        </View>
      </View>

      <View style={styles.timeframeContainer}>
        {(['month', 'year', 'all'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.timeframeButton,
              timeframe === period && styles.timeframeButtonActive,
            ]}
            onPress={() => setTimeframe(period)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                timeframe === period && styles.timeframeButtonTextActive,
              ]}
            >
              {timeframeLabels[period]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.metricsGrid}>
        <InsightCard
          label="Transactions"
          value={String(stats.transactionCount)}
          detail="Recorded entries"
        />
        <InsightCard
          label="Average"
          value={formatCurrency(stats.averageExpense)}
          detail="Expense per entry"
        />
        <InsightCard
          label="Top Spend"
          value={highestExpense?.name ?? 'None'}
          detail={highestExpense ? formatCurrency(highestExpense.amount) : 'No expenses'}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cash Flow Trend</Text>
          <Text style={styles.sectionMeta}>{stats.trend.length} periods</Text>
        </View>
        <View style={styles.trendCard}>
          {stats.trend.map((point) => (
            <View key={point.key} style={styles.trendColumn}>
              <View style={styles.trendBars}>
                <View
                  style={[
                    styles.trendBar,
                    styles.incomeBar,
                    { height: `${Math.max(4, (point.income / maxTrendValue) * 100)}%` },
                  ]}
                />
                <View
                  style={[
                    styles.trendBar,
                    styles.expenseBar,
                    {
                      height: `${Math.max(4, (point.expenses / maxTrendValue) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.trendLabel}>{point.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.legendRow}>
          <Legend color={palette.income} label="Income" />
          <Legend color={palette.expense} label="Expenses" />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expense Mix</Text>
          <Text style={styles.sectionMeta}>Top categories</Text>
        </View>

        {stats.topExpenseCategories.length > 0 ? (
          <View style={styles.chartCard}>
            <View style={styles.mixRail}>
              {stats.topExpenseCategories.map((item) => (
                <View
                  key={item.categoryId}
                  style={[
                    styles.mixSegment,
                    {
                      width: `${Math.max(5, item.percentage)}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              ))}
            </View>

            {stats.topExpenseCategories.map((item) => (
              <CategoryBar
                key={item.categoryId}
                name={item.name}
                color={item.color}
                amount={item.amount}
                percentage={item.percentage}
              />
            ))}
          </View>
        ) : (
          <EmptyCard message="No expense data for this period." />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Income Sources</Text>
          <Text style={styles.sectionMeta}>Contribution</Text>
        </View>

        {stats.topIncomeCategories.length > 0 ? (
          <View style={styles.chartCard}>
            {stats.topIncomeCategories.map((item) => (
              <CategoryBar
                key={item.categoryId}
                name={item.name}
                color={item.color}
                amount={item.amount}
                percentage={item.percentage}
              />
            ))}
          </View>
        ) : (
          <EmptyCard message="No income data for this period." />
        )}
      </View>
    </ScrollView>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

function InsightCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.insightDetail} numberOfLines={1}>
        {detail}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function CategoryBar({
  name,
  color,
  amount,
  percentage,
}: {
  name: string;
  color: string;
  amount: number;
  percentage: number;
}) {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitle}>
          <View style={[styles.categoryDot, { backgroundColor: color }]} />
          <Text style={styles.categoryName} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
      </View>
      <View style={styles.categoryTrack}>
        <View
          style={[
            styles.categoryFill,
            { width: `${Math.max(3, percentage)}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.categoryPercent}>{percentage.toFixed(1)}%</Text>
    </View>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function sumByType(transactions: Transaction[], type: Transaction['type']) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function buildTrend(transactions: Transaction[], timeframe: MoneyPeriod): TrendPoint[] {
  if (timeframe === 'month') {
    return buildDailyTrend(transactions);
  }

  if (timeframe === 'year') {
    return buildMonthlyTrend(transactions, 6);
  }

  return buildMonthlyTrend(transactions, 8);
}

function buildDailyTrend(transactions: Transaction[]): TrendPoint[] {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().split('T')[0];
    const dayTransactions = transactions.filter((transaction) => transaction.date === key);

    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      income: sumByType(dayTransactions, 'income'),
      expenses: sumByType(dayTransactions, 'expense'),
      balance: sumByType(dayTransactions, 'income') - sumByType(dayTransactions, 'expense'),
    };
  });
}

function buildMonthlyTrend(
  transactions: Transaction[],
  visibleMonths: number,
): TrendPoint[] {
  const today = new Date();

  return Array.from({ length: visibleMonths }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (visibleMonths - 1 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthTransactions = transactions.filter((transaction) =>
      transaction.date.startsWith(key),
    );
    const income = sumByType(monthTransactions, 'income');
    const expenses = sumByType(monthTransactions, 'expense');

    return {
      key,
      label: date.toLocaleDateString('en-US', { month: 'short' }).slice(0, 3),
      income,
      expenses,
      balance: income - expenses,
    };
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    ...shadows.card,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  balanceBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  balanceLabel: {
    marginTop: spacing.xxl,
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    marginTop: spacing.xs,
    color: palette.text,
    fontSize: 38,
    fontWeight: '900',
  },
  cashFlowBar: {
    height: 12,
    borderRadius: radius.pill,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: palette.surfaceMuted,
    marginTop: spacing.xl,
  },
  cashFlowFill: {
    height: '100%',
  },
  headerMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  metric: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  metricLabel: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: '900',
  },
  timeframeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  timeframeButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: palette.primary,
  },
  timeframeButtonText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '900',
  },
  timeframeButtonTextActive: {
    color: palette.background,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  insightCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.card,
  },
  insightLabel: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  insightValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  insightDetail: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '800',
  },
  trendCard: {
    height: 190,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  trendBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  trendBar: {
    width: 7,
    minHeight: 4,
    borderRadius: radius.pill,
  },
  incomeBar: {
    backgroundColor: palette.income,
  },
  expenseBar: {
    backgroundColor: palette.expense,
  },
  trendLabel: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
  },
  legendText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  chartCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  mixRail: {
    height: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: palette.surfaceMuted,
    marginBottom: spacing.xl,
  },
  mixSegment: {
    height: '100%',
  },
  categoryRow: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    marginRight: spacing.md,
  },
  categoryName: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryAmount: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  categoryTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: palette.surfaceMuted,
  },
  categoryFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  categoryPercent: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
});
