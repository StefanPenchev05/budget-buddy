import { useMoneyTracker } from "@/src/composition/use-money-tracker";
import {
  getCategoryTotals,
  getCurrentMonthKey,
} from "@/src/domain/money/analytics";
import { formatCurrency } from "@/src/shared/formatting/formatters";
import {
  palette,
  radius,
  shadows,
  spacing,
} from "@/src/shared/theme/design-tokens";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type BudgetCircleProps = {
  monthKey?: string;
  subtitle?: string;
};

export function BudgetCircle({
  monthKey,
  subtitle,
}: Readonly<BudgetCircleProps>) {
  const { transactions, categories } = useMoneyTracker();

  const { categorySpending, totalExpense, totalIncome, net } = useMemo(() => {
    const effectiveMonthKey = monthKey ?? getCurrentMonthKey();
    const monthlyTransactions = transactions.filter((transaction) =>
      transaction.date.startsWith(effectiveMonthKey),
    );

    const monthlyExpenses = monthlyTransactions.filter(
      (transaction) => transaction.type === "expense",
    );
    const monthlyIncome = monthlyTransactions.filter(
      (transaction) => transaction.type === "income",
    );

    const expenseTotal = monthlyExpenses.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    const incomeTotal = monthlyIncome.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );

    return {
      categorySpending: getCategoryTotals(
        monthlyExpenses,
        categories,
        "expense",
      ),
      totalExpense: expenseTotal,
      totalIncome: incomeTotal,
      net: incomeTotal - expenseTotal,
    };
  }, [transactions, categories]);

  const netColor = net >= 0 ? palette.income : palette.expense;
  const netPrefix = net > 0 ? "+" : "";
  const netToneSurface = net >= 0 ? palette.incomeSoft : palette.expenseSoft;
  const netToneBorder = net >= 0 ? palette.incomeSoft : palette.expenseSoft;
  const netDescriptor = net >= 0 ? "Up" : "Down";
  const netMessage = net >= 0 ? "You're ahead" : "You're behind";

  const topCategories = categorySpending.slice(0, 4);
  const remainingCategories = Math.max(
    0,
    categorySpending.length - topCategories.length,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Monthly Snapshot</Text>
          <Text style={styles.subtitle}>{subtitle ?? "This Month"}</Text>
        </View>
        <View
          style={[
            styles.netBadge,
            {
              backgroundColor: netToneSurface,
              borderColor: netColor,
            },
          ]}
        >
          <Text style={[styles.netBadgeText, { color: netColor }]}>
            {" "}
            {netDescriptor}{" "}
          </Text>
        </View>
      </View>

      <View style={styles.circleContainer}>
        <View style={[styles.circle, { borderColor: netToneBorder }]}>
          <View style={[styles.circleGlow, { backgroundColor: netColor }]} />
          <View style={styles.centerContent}>
            <Text style={styles.totalLabel}>Net</Text>
            <Text style={[styles.totalAmount, { color: netColor }]}>
              {netPrefix}
              {formatCurrency(net)}
            </Text>
            <Text style={styles.totalMeta}>{netMessage} this month</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <View style={styles.statTopRow}>
            <View
              style={[styles.statIcon, { backgroundColor: palette.incomeSoft }]}
            >
              <Text style={[styles.statIconText, { color: palette.income }]}>
                ↑
              </Text>
            </View>
            <Text style={styles.statLabel}>Income</Text>
          </View>
          <Text style={[styles.statValue, { color: palette.income }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={styles.statPill}>
          <View style={styles.statTopRow}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: palette.expenseSoft },
              ]}
            >
              <Text style={[styles.statIconText, { color: palette.expense }]}>
                ↓
              </Text>
            </View>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <Text style={[styles.statValue, { color: palette.expense }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>Top Spending</Text>
          {remainingCategories > 0 && (
            <Text style={styles.breakdownHint}>
              +{remainingCategories} more
            </Text>
          )}
        </View>

        {topCategories.length > 0 ? (
          topCategories.map((item) => (
            <View key={item.categoryId} style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <View
                  style={[
                    styles.breakdownColor,
                    { backgroundColor: item.color },
                  ]}
                />
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownName}>{item.name}</Text>
                  <Text style={styles.breakdownAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
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
                <Text style={styles.percentageText}>
                  {item.percentage.toFixed(0)}%
                </Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.text,
  },
  subtitle: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: spacing.xs,
    fontWeight: "700",
  },
  netBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginLeft: spacing.md,
  },
  netBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  circle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: palette.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 12,
    borderColor: palette.primarySoft,
    overflow: "hidden",
  },
  circleGlow: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.18,
  },
  centerContent: {
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: palette.text,
  },
  totalMeta: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: "700",
    color: palette.textSubtle,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statPill: {
    flex: 1,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  statIconText: {
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 14,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textSubtle,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statValue: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: "900",
    color: palette.text,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.textSubtle,
    textTransform: "uppercase",
  },
  breakdownHint: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.textMuted,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
  },
  breakdownAmount: {
    fontSize: 11,
    color: palette.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  percentageContainer: {
    width: 80,
    alignItems: "flex-end",
    gap: 4,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.textMuted,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: "600",
  },
});
