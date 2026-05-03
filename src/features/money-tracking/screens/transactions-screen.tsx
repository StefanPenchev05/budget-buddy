import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { Transaction } from '@/src/domain/money/types';
import { EditTransactionModal } from '@/src/features/money-tracking/components/edit-transaction-modal';
import { TransactionList } from '@/src/features/money-tracking/components/transaction-list';
import { palette, radius, spacing } from '@/src/shared/theme/design-tokens';

type FilterType = 'all' | 'expense' | 'income';

export default function TransactionsScreen() {
  const { transactions, categories, isLoading, loadTransactions, deleteTransaction, updateTransaction } =
    useMoneyTracker();
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter);

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'expense' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('expense')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'expense' && styles.filterButtonTextActive,
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'income' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('income')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'income' && styles.filterButtonTextActive,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.contentContainer}>
          <TransactionList
            transactions={filteredTransactions}
            categories={categories}
            isLoading={isLoading}
            onDeleteTransaction={handleDelete}
            onEditTransaction={setEditingTransaction}
            groupByDate={true}
          />
        </View>
      </ScrollView>
      <EditTransactionModal
        categories={categories}
        transaction={editingTransaction}
        visible={!!editingTransaction}
        onClose={() => setEditingTransaction(undefined)}
        onSave={updateTransaction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.textMuted,
  },
  filterButtonTextActive: {
    color: palette.surface,
  },
  listContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
});
