import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Category, Transaction } from '@/src/domain/money/types';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { generateId } from '@/src/shared/ids/id-generator';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

type TransactionType = 'expense' | 'income';

const quickAmounts = [5, 10, 25, 50, 100, 250];

export default function AddTransactionScreen() {
  const { categories, addTransaction } = useMoneyTracker();
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const amountValue = Number.parseFloat(amount) || 0;
  const previewSign = type === 'income' ? '+' : '-';
  const typeAccent = type === 'income' ? palette.income : palette.expense;
  const typeSoft = type === 'income' ? palette.incomeSoft : palette.expenseSoft;

  useEffect(() => {
    const categoryStillValid = filteredCategories.some(
      (category) => category.id === selectedCategory?.id,
    );

    if (!categoryStillValid) {
      setSelectedCategory(filteredCategories[0]);
    }
  }, [filteredCategories, selectedCategory?.id]);

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(String(value));
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date());
    setSelectedCategory(categories.find((category) => category.type === type));
  };

  const handleAddTransaction = async () => {
    if (!amountValue || !selectedCategory) {
      Alert.alert('Missing details', 'Enter an amount and select a category.');
      return;
    }

    if (amountValue <= 0) {
      Alert.alert('Invalid amount', 'Amount must be greater than 0.');
      return;
    }

    try {
      setIsLoading(true);
      const transaction: Transaction = {
        id: generateId(),
        categoryId: selectedCategory.id,
        amount: amountValue,
        description: description.trim(),
        date: date.toISOString().split('T')[0],
        type,
      };

      await addTransaction(transaction);
      resetForm();
      Alert.alert('Saved', 'Transaction added successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.eyebrow}>New Transaction</Text>
              <Text style={styles.heroTitle}>
                {selectedCategory?.name ?? 'Choose category'}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: typeSoft }]}>
              <Text style={[styles.typeBadgeText, { color: typeAccent }]}>
                {type === 'income' ? 'Income' : 'Expense'}
              </Text>
            </View>
          </View>

          <View style={styles.amountInputWrapper}>
            <Text style={[styles.currencySymbol, { color: typeAccent }]}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={palette.textSubtle}
              autoFocus
            />
          </View>

          <Text style={styles.previewText}>
            {amountValue > 0
              ? `${previewSign}$${amountValue.toFixed(2)} on ${date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}`
              : 'Enter an amount to preview the entry'}
          </Text>
        </View>

        <View style={styles.segmentedControl}>
          {(['expense', 'income'] as const).map((item) => {
            const isActive = type === item;
            const accent = item === 'income' ? palette.income : palette.expense;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.segment,
                  isActive && { backgroundColor: accent, borderColor: accent },
                ]}
                onPress={() => handleTypeChange(item)}
                activeOpacity={0.85}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {item === 'income' ? 'Income' : 'Expense'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quickAmountSection}>
          <Text style={styles.sectionLabel}>Quick Amount</Text>
          <View style={styles.quickAmountGrid}>
            {quickAmounts.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountButton,
                  amount === String(value) && styles.quickAmountButtonActive,
                ]}
                onPress={() => handleQuickAmount(value)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === String(value) && styles.quickAmountTextActive,
                  ]}
                >
                  ${value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.optionsCard}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: selectedCategory?.color ?? palette.surfaceMuted },
                ]}
              >
                <Text style={styles.optionEmoji}>{selectedCategory?.icon ?? '•'}</Text>
              </View>
              <View>
                <Text style={styles.optionLabel}>Category</Text>
                <Text style={styles.optionValue}>
                  {selectedCategory?.name ?? 'Select category'}
                </Text>
              </View>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconMuted}>
                <Text style={styles.optionEmoji}>📅</Text>
              </View>
              <View>
                <Text style={styles.optionLabel}>Date</Text>
                <Text style={styles.optionValue}>
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.noteRow}>
            <View style={styles.optionIconMuted}>
              <Text style={styles.optionEmoji}>✎</Text>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Add note"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={palette.textSubtle}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: typeAccent },
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleAddTransaction}
          disabled={isLoading}
          activeOpacity={0.86}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Saving...' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Category</Text>
                <Text style={styles.modalSubtitle}>
                  Showing {type === 'income' ? 'income' : 'expense'} categories
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.categoriesGrid}
              contentContainerStyle={styles.categoriesGridContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredCategories.map((category) => {
                const isSelected = selectedCategory?.id === category.id;

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryGridItem,
                      isSelected && styles.categoryGridItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryModal(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.categoryGridIcon,
                        { backgroundColor: category.color },
                      ]}
                    >
                      <Text style={styles.categoryGridEmoji}>{category.icon}</Text>
                    </View>
                    <Text style={styles.categoryGridName}>{category.name}</Text>
                    {isSelected && <Text style={styles.categorySelectedMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </KeyboardAvoidingView>
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
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows.card,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textSubtle,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontSize: 22,
    fontWeight: '900',
    color: palette.text,
  },
  typeBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  currencySymbol: {
    fontSize: 46,
    fontWeight: '900',
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 52,
    fontWeight: '900',
    color: palette.text,
    paddingVertical: spacing.sm,
  },
  previewText: {
    marginTop: spacing.sm,
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  segment: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: palette.background,
  },
  quickAmountSection: {
    gap: spacing.md,
  },
  sectionLabel: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAmountButton: {
    minWidth: 74,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  quickAmountButtonActive: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  quickAmountText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  quickAmountTextActive: {
    color: palette.primary,
  },
  optionsCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  optionRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconMuted: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionLabel: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  optionValue: {
    marginTop: 2,
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  optionArrow: {
    color: palette.textSubtle,
    fontSize: 26,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginLeft: 72,
  },
  noteRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  noteInput: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: palette.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.text,
  },
  modalSubtitle: {
    marginTop: spacing.xs,
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
  },
  modalClose: {
    color: palette.textMuted,
    fontSize: 26,
    lineHeight: 28,
  },
  categoriesGrid: {
    paddingHorizontal: spacing.lg,
  },
  categoriesGridContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  categoryGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.md,
  },
  categoryGridItemSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  categoryGridIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGridEmoji: {
    fontSize: 22,
  },
  categoryGridName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
  },
  categorySelectedMark: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: '900',
  },
});
