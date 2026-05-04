import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMoneyTracker } from "@/src/composition/use-money-tracker";
import { Budget, Category } from "@/src/domain/money/types";
import { useSnackbar } from "@/src/shared/feedback/snackbar";
import { formatCurrency } from "@/src/shared/formatting/formatters";
import { generateId } from "@/src/shared/ids/id-generator";
import {
    palette,
    radius,
    shadows,
    spacing,
} from "@/src/shared/theme/design-tokens";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type BudgetProgress = {
  budget: Budget;
  category?: Category;
  spent: number;
  remaining: number;
  percentage: number;
};

export default function BudgetsScreen() {
  const {
    budgets,
    categories,
    transactions,
    loadBudgets,
    upsertBudget,
    deleteBudget,
  } = useMoneyTracker();
  const { showSnackbar } = useSnackbar();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const currentMonth = new Date().toISOString().slice(0, 7);
  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );

  useEffect(() => {
    loadBudgets(currentMonth);
  }, [currentMonth, loadBudgets]);

  const budgetProgress = useMemo<BudgetProgress[]>(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.categoryId === budget.categoryId &&
            transaction.date.startsWith(budget.month),
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return {
        budget,
        category: categories.find(
          (category) => category.id === budget.categoryId,
        ),
        spent,
        remaining: budget.limitAmount - spent,
        percentage:
          budget.limitAmount > 0
            ? Math.min((spent / budget.limitAmount) * 100, 100)
            : 0,
      };
    });
  }, [budgets, categories, transactions]);

  const totalLimit = budgetProgress.reduce(
    (sum, item) => sum + item.budget.limitAmount,
    0,
  );
  const totalSpent = budgetProgress.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallProgress =
    totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

  const openCreateModal = () => {
    setSelectedCategoryId(expenseCategories[0]?.id ?? "");
    setBudgetAmount("");
    setShowModal(true);
  };

  const handleSaveBudget = async () => {
    const parsedAmount = Number.parseFloat(budgetAmount);

    if (!selectedCategoryId || !parsedAmount || parsedAmount <= 0) {
      Alert.alert(
        "Invalid budget",
        "Choose a category and enter a monthly limit above 0.",
      );
      return;
    }

    const existingBudget = budgets.find(
      (budget) =>
        budget.categoryId === selectedCategoryId &&
        budget.month === currentMonth,
    );

    await upsertBudget({
      id: existingBudget?.id ?? generateId(),
      categoryId: selectedCategoryId,
      limitAmount: parsedAmount,
      month: currentMonth,
    });
    setShowModal(false);
    showSnackbar({ message: "Budget saved" });
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert("Delete Budget", "Remove this monthly budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBudget(budget.id, currentMonth);
          showSnackbar({ message: "Budget deleted", tone: "info" });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Monthly Budgets</Text>
          <Text style={styles.title}>{formatCurrency(totalRemaining)}</Text>
          <Text style={styles.subtitle}>
            {totalRemaining >= 0
              ? "Remaining this month"
              : "Over budget this month"}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${overallProgress}%`,
                  backgroundColor:
                    overallProgress >= 90 ? palette.expense : palette.primary,
                },
              ]}
            />
          </View>

          <View style={styles.heroMetrics}>
            <Metric label="Budgeted" value={formatCurrency(totalLimit)} />
            <Metric label="Spent" value={formatCurrency(totalSpent)} />
            <Metric label="Goals" value={String(budgets.length)} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category Limits</Text>
          <TouchableOpacity
            style={styles.smallAddButton}
            onPress={openCreateModal}
          >
            <Text style={styles.smallAddButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {budgetProgress.length > 0 ? (
          budgetProgress.map((item) => (
            <View key={item.budget.id} style={styles.budgetCard}>
              <View style={styles.budgetTopRow}>
                <View style={styles.categoryTitle}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          item.category?.color ?? palette.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={styles.categoryIconText}>
                      {item.category?.icon ?? "•"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.categoryName}>
                      {item.category?.name ?? "Unknown"}
                    </Text>
                    <Text style={styles.budgetMeta}>
                      {formatCurrency(item.spent)} of{" "}
                      {formatCurrency(item.budget.limitAmount)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteBudget(item.budget)}
                >
                  <IconSymbol
                    name="xmark"
                    size={20}
                    color={palette.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.budgetProgressTrack}>
                <View
                  style={[
                    styles.budgetProgressFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor:
                        item.percentage >= 90
                          ? palette.expense
                          : (item.category?.color ?? palette.primary),
                    },
                  ]}
                />
              </View>

              <View style={styles.budgetBottomRow}>
                <Text
                  style={[
                    styles.remainingText,
                    {
                      color:
                        item.remaining >= 0 ? palette.income : palette.expense,
                    },
                  ]}
                >
                  {formatCurrency(Math.abs(item.remaining))}{" "}
                  {item.remaining >= 0 ? "left" : "over"}
                </Text>
                <Text style={styles.percentText}>
                  {item.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <IconSymbol
              name="scope"
              size={40}
              color={palette.primary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No budget goals yet</Text>
            <Text style={styles.emptyText}>
              Add category limits to compare real spending against your monthly
              plan.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openCreateModal}
            >
              <Text style={styles.emptyButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Budget Goal</Text>
                <Text style={styles.modalSubtitle}>
                  Set a limit for {currentMonth}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowModal(false)}
              >
                <IconSymbol name="xmark" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {expenseCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategoryId === category.id &&
                        styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                  >
                    <Text style={styles.categoryOptionIcon}>
                      {category.icon}
                    </Text>
                    <Text style={styles.categoryOptionName} numberOfLines={1}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Monthly Limit</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor={palette.textSubtle}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveBudget}
              >
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    ...shadows.card,
  },
  eyebrow: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: palette.text,
    fontSize: 38,
    fontWeight: "900",
    marginTop: spacing.sm,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 12,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: palette.surfaceMuted,
    marginTop: spacing.xl,
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  heroMetrics: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  metric: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  metricLabel: {
    color: palette.textSubtle,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "900",
  },
  smallAddButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  smallAddButtonText: {
    color: palette.background,
    fontWeight: "900",
  },
  budgetCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  budgetTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  categoryTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconText: {
    fontSize: 22,
  },
  categoryName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "900",
  },
  budgetMeta: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  deleteText: {
    color: palette.textSubtle,
    fontSize: 26,
    lineHeight: 28,
  },
  budgetProgressTrack: {
    height: 9,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: palette.surfaceMuted,
    marginTop: spacing.lg,
  },
  budgetProgressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  budgetBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: "900",
  },
  percentText: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: "center",
    ...shadows.card,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    color: palette.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
    fontWeight: "700",
  },
  emptyButton: {
    marginTop: spacing.xl,
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyButtonText: {
    color: palette.background,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.68)",
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.border,
    alignSelf: "center",
    marginTop: spacing.md,
  },
  modalHeader: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: palette.textSubtle,
    marginTop: spacing.xs,
    fontWeight: "700",
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: palette.textMuted,
    fontSize: 26,
    lineHeight: 28,
  },
  modalBody: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  formLabel: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryOption: {
    width: "31.5%",
    minHeight: 76,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  categoryOptionSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  categoryOptionIcon: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  categoryOptionName: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "800",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  currencySymbol: {
    color: palette.primary,
    fontSize: 28,
    fontWeight: "900",
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 32,
    fontWeight: "900",
    paddingVertical: spacing.md,
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    color: palette.textMuted,
    fontWeight: "900",
  },
  saveButton: {
    flex: 1.4,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
  },
  saveButtonText: {
    color: palette.background,
    fontWeight: "900",
  },
});
