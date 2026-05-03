import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { Transaction, Category } from '@/src/domain/money/types';
import { TransactionItem } from './transaction-item';
import { formatDateShort, isToday } from '@/src/shared/formatting/formatters';
import { palette, radius, spacing } from '@/src/shared/theme/design-tokens';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  isLoading?: boolean;
  onDeleteTransaction?: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  groupByDate?: boolean;
  showTypeFilter?: boolean;
}

interface SectionData {
  title: string;
  data: Transaction[];
}

export function TransactionList({
  transactions,
  categories,
  isLoading = false,
  onDeleteTransaction,
  onEditTransaction,
  groupByDate = true,
}: TransactionListProps) {
  const getCategoryById = (id: string) =>
    categories.find((cat) => cat.id === id);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No transactions yet</Text>
        <Text style={styles.emptySubtext}>
          Add your first transaction to get started
        </Text>
      </View>
    );
  }

  if (groupByDate) {
    const sections: SectionData[] = [];
    const grouped: { [key: string]: Transaction[] } = {};

    transactions.forEach((tx) => {
      const dateKey = formatDateShort(tx.date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(tx);
    });

    Object.entries(grouped).forEach(([date, items]) => {
      sections.push({
        title: isToday(items[0].date)
          ? 'Today'
          : date,
        data: items,
      });
    });

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={getCategoryById(item.categoryId)}
            onDelete={onDeleteTransaction}
            onEdit={onEditTransaction}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        scrollEnabled={false}
      />
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TransactionItem
          transaction={item}
          category={getCategoryById(item.categoryId)}
          onDelete={onDeleteTransaction}
          onEdit={onEditTransaction}
        />
      )}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.textMuted,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    textTransform: 'uppercase',
  },
});
