import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { useSnackbar } from '@/src/shared/feedback/snackbar';
import { palette, radius, shadows, spacing } from '@/src/shared/theme/design-tokens';

interface EditTransactionModalProps {
  categories: Category[];
  transaction?: Transaction;
  visible: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => Promise<void>;
}

export function EditTransactionModal({
  categories,
  transaction,
  visible,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  const { showSnackbar } = useSnackbar();
  const [type, setType] = useState<Transaction['type']>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  useEffect(() => {
    if (!transaction) {
      return;
    }

    setType(transaction.type);
    setCategoryId(transaction.categoryId);
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setDate(new Date(transaction.date));
  }, [transaction]);

  useEffect(() => {
    if (!filteredCategories.some((category) => category.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id ?? '');
    }
  }, [categoryId, filteredCategories]);

  const selectedCategory = categories.find((category) => category.id === categoryId);

  const handleSave = async () => {
    if (!transaction) {
      return;
    }

    const parsedAmount = Number.parseFloat(amount);

    if (!categoryId || !parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid transaction', 'Choose a category and enter an amount above 0.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...transaction,
        amount: parsedAmount,
        categoryId,
        date: date.toISOString().split('T')[0],
        description: description.trim(),
        type,
      });
      onClose();
      showSnackbar({ message: 'Transaction updated' });
    } catch (error) {
      console.error(error);
      showSnackbar({ message: 'Update not saved', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Edit Transaction</Text>
              <Text style={styles.title}>{selectedCategory?.name ?? 'Transaction'}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.segmentedControl}>
              {(['expense', 'income'] as const).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.segment, type === item && styles.segmentActive]}
                  onPress={() => setType(item)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      type === item && styles.segmentTextActive,
                    ]}
                  >
                    {item === 'income' ? 'Income' : 'Expense'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={palette.textSubtle}
              />
            </View>

            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    categoryId === category.id && styles.categoryOptionActive,
                  ]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.optionRow} onPress={() => setShowDatePicker(true)}>
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
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.noteBox}>
              <Text style={styles.optionLabel}>Note</Text>
              <TextInput
                style={styles.noteInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Add note"
                placeholderTextColor={palette.textSubtle}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }

                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  eyebrow: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
  },
  closeText: {
    color: palette.textMuted,
    fontSize: 26,
    lineHeight: 28,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  segment: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: palette.primary,
  },
  segmentText: {
    color: palette.textMuted,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: palette.background,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  currencySymbol: {
    color: palette.primary,
    fontSize: 36,
    fontWeight: '900',
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    color: palette.text,
    fontSize: 38,
    fontWeight: '900',
    paddingVertical: spacing.md,
  },
  sectionLabel: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    width: '31.5%',
    minHeight: 76,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
  },
  categoryOptionActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  categoryName: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '800',
  },
  optionRow: {
    minHeight: 64,
    borderRadius: radius.lg,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    color: palette.textSubtle,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  optionValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  optionArrow: {
    color: palette.textSubtle,
    fontSize: 24,
  },
  noteBox: {
    borderRadius: radius.lg,
    backgroundColor: palette.surfaceMuted,
    padding: spacing.lg,
  },
  noteInput: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  cancelButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
  },
  cancelText: {
    color: palette.textMuted,
    fontWeight: '900',
  },
  saveButton: {
    flex: 1.4,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: palette.primary,
    ...shadows.card,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveText: {
    color: palette.background,
    fontWeight: '900',
  },
});
