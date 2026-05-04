import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMoneyTracker } from "@/src/composition/use-money-tracker";
import { getCurrentMonthKey } from "@/src/domain/money/analytics";
import { Transaction } from "@/src/domain/money/types";
import { BudgetCircle } from "@/src/features/money-tracking/components/budget-circle";
import { EditTransactionModal } from "@/src/features/money-tracking/components/edit-transaction-modal";
import { TransactionList } from "@/src/features/money-tracking/components/transaction-list";
import {
    palette,
    radius,
    shadows,
    spacing,
} from "@/src/shared/theme/design-tokens";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DashboardScreen() {
  const router = useRouter();
  const {
    transactions,
    categories,
    isLoading,
    loadTransactions,
    calculateSummary,
    deleteTransaction,
    updateTransaction,
  } = useMoneyTracker();
  const [refreshing, setRefreshing] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<
    Transaction | undefined
  >();
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

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary, transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1),
    );
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
    );
    const today = new Date();

    // Don't allow going past current month
    if (
      nextMonth.getFullYear() > today.getFullYear() ||
      (nextMonth.getFullYear() === today.getFullYear() &&
        nextMonth.getMonth() > today.getMonth())
    ) {
      return;
    }

    setSelectedMonth(nextMonth);
  };

  const monthLabel = selectedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const monthKey = getCurrentMonthKey(selectedMonth);
  const isCurrentMonth =
    new Date().getMonth() === selectedMonth.getMonth() &&
    new Date().getFullYear() === selectedMonth.getFullYear();
  const canGoToNextMonth = (() => {
    const nextMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
    );
    const today = new Date();
    return !(
      nextMonth.getFullYear() > today.getFullYear() ||
      (nextMonth.getFullYear() === today.getFullYear() &&
        nextMonth.getMonth() > today.getMonth())
    );
  })();

  const recentTransactions = monthTransactions.slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.monthNavButton}
        >
          <IconSymbol name="chevron.left" size={22} color={palette.textMuted} />
        </TouchableOpacity>
        <View style={styles.monthDisplay}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          {isCurrentMonth && <Text style={styles.currentBadge}>Today</Text>}
        </View>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={[
            styles.monthNavButton,
            !canGoToNextMonth && styles.monthNavButtonDisabled,
          ]}
          disabled={!canGoToNextMonth}
        >
          <IconSymbol
            name="chevron.right"
            size={22}
            color={canGoToNextMonth ? palette.textMuted : palette.textSubtle}
          />
        </TouchableOpacity>
      </View>

      {/* Budget Circle - Main Focus */}
      <View style={styles.budgetSection}>
        <BudgetCircle
          monthKey={monthKey}
          subtitle={isCurrentMonth ? "This Month" : monthLabel}
        />
      </View>

      <View style={styles.transactionsSection}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
  },
  monthNavButtonDisabled: {
    opacity: 0.4,
  },
  monthNavArrow: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.text,
  },
  monthNavArrowDisabled: {
    opacity: 0.5,
  },
  monthDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: palette.text,
  },
  currentBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: palette.primary,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  budgetSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.text,
  },
  seeAllLink: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: "800",
  },
  emptyContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: palette.textMuted,
  },
});
