import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Transaction, Category } from '@/src/domain/money/types';
import { formatCurrency, formatDateShort } from '@/src/shared/formatting/formatters';
import { palette, radius, spacing } from '@/src/shared/theme/design-tokens';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionItem({
  transaction,
  category,
  onDelete,
  onEdit,
}: TransactionItemProps) {
  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(transaction.id),
      },
    ]);
  };

  const isIncome = transaction.type === 'income';
  const signSymbol = isIncome ? '+' : '−';
  const amountColor = isIncome ? palette.income : palette.expense;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onEdit?.(transaction)}
      onLongPress={handleDelete}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[styles.categoryBadge, { backgroundColor: category?.color || palette.surfaceMuted }]}>
          <Text style={styles.categoryIcon}>{category?.icon || '📌'}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.categoryName}>{category?.name || 'Unknown'}</Text>
          <Text style={styles.description}>{transaction.description || 'No note'}</Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {signSymbol} {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.date}>{formatDateShort(transaction.date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryIcon: {
    fontSize: 24,
  },
  details: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '600',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: 11,
    color: palette.textSubtle,
    fontWeight: '600',
  },
});
