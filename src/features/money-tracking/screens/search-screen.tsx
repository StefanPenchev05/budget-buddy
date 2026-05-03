import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Share,
} from 'react-native';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { Transaction } from '@/src/domain/money/types';
import { EditTransactionModal } from '@/src/features/money-tracking/components/edit-transaction-modal';
import { TransactionList } from '@/src/features/money-tracking/components/transaction-list';
import { formatCurrency } from '@/src/shared/formatting/formatters';
import { useSnackbar } from '@/src/shared/feedback/snackbar';

export default function SearchScreen() {
  const { transactions, categories, deleteTransaction, updateTransaction } = useMoneyTracker();
  const { showSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          categories
            .find((c) => c.id === t.categoryId)
            ?.name.toLowerCase()
            .includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }

    // Filter by category
    if (filterCategory) {
      result = result.filter((t) => t.categoryId === filterCategory);
    }

    // Sort
    if (sortBy === 'amount') {
      result = [...result].sort((a, b) => b.amount - a.amount);
    }

    return result;
  }, [searchQuery, filterType, filterCategory, sortBy, transactions, categories]);

  const handleExportCSV = async () => {
    try {
      let csv = 'Date,Category,Description,Amount,Type\n';

      filteredTransactions.forEach((t) => {
        const category = categories.find((c) => c.id === t.categoryId);
        csv += `${t.date},"${category?.name || 'Unknown'}","${t.description}",${t.amount},${t.type}\n`;
      });

      // Copy to clipboard or share
      await Share.share({
        message: csv,
        title: 'Export Transactions',
      });

      showSnackbar({ message: 'Transactions exported' });
    } catch {
      showSnackbar({ message: 'Export not completed', tone: 'error' });
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const relevantCategories =
    filterType === 'income'
      ? incomeCategories
      : filterType === 'expense'
        ? expenseCategories
        : categories;

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8997B3"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <ScrollView style={styles.filtersContainer} horizontal showsHorizontalScrollIndicator={false}>
          {/* Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Type:</Text>
            {(['all', 'expense', 'income'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterTag,
                  filterType === type && styles.filterTagActive,
                ]}
                onPress={() => {
                  setFilterType(type);
                  setFilterCategory(null);
                }}
              >
                <Text
                  style={[
                    styles.filterTagText,
                    filterType === type && styles.filterTagTextActive,
                  ]}
                >
                  {type === 'all' ? 'All' : type === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category:</Text>
            {relevantCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterTag,
                  filterCategory === category.id && styles.filterTagActive,
                ]}
                onPress={() => setFilterCategory(filterCategory === category.id ? null : category.id)}
              >
                <Text style={styles.filterTagText}>{category.icon} {category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort:</Text>
            {(['date', 'amount'] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.filterTag,
                  sortBy === sort && styles.filterTagActive,
                ]}
                onPress={() => setSortBy(sort)}
              >
                <Text
                  style={[
                    styles.filterTagText,
                    sortBy === sort && styles.filterTagTextActive,
                  ]}
                >
                  {sort === 'date' ? 'Date' : 'Amount'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Results Summary */}
      <View style={styles.resultsHeader}>
        <View>
          <Text style={styles.resultsLabel}>
            {filteredTransactions.length} results
          </Text>
          <Text style={styles.resultsAmount}>
            Total: {formatCurrency(Math.abs(totalAmount))}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportCSV}
        >
          <Text style={styles.exportButtonText}>📥 Export</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <TransactionList
          transactions={filteredTransactions}
          categories={categories}
          onDeleteTransaction={deleteTransaction}
          onEditTransaction={setEditingTransaction}
          groupByDate={true}
        />
      </View>
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
    backgroundColor: '#0B1020',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#141B2D',
    borderBottomWidth: 1,
    borderBottomColor: '#2B3654',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2B3654',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F5F7FB',
  },
  filterButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 18,
  },
  filtersContainer: {
    backgroundColor: '#141B2D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B3654',
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C7D2E5',
  },
  filterTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#141B2D',
  },
  filterTagActive: {
    backgroundColor: '#7C8CFF',
    borderColor: '#7C8CFF',
  },
  filterTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C7D2E5',
  },
  filterTagTextActive: {
    color: '#141B2D',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#141B2D',
  },
  resultsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  resultsAmount: {
    fontSize: 12,
    color: '#C7D2E5',
    marginTop: 2,
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7C8CFF',
    borderRadius: 6,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#141B2D',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
