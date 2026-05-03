import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { RecurringTransaction } from '@/src/domain/money/types';
import { generateId } from '@/src/shared/ids/id-generator';
import { CategoryPicker } from '@/src/features/money-tracking/components/category-picker';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { useSnackbar } from '@/src/shared/feedback/snackbar';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RecurringScreen() {
  const { categories } = useMoneyTracker();
  const { showSnackbar } = useSnackbar();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find((c) => c.type === type)
  );
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pattern, setPattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleAddRecurring = () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newRecurring: RecurringTransaction = {
      id: generateId(),
      categoryId: selectedCategory.id,
      amount: parseFloat(amount),
      description,
      pattern,
      startDate: startDate.toISOString().split('T')[0],
      endDate: hasEndDate ? endDate?.toISOString().split('T')[0] : undefined,
      type,
      active: true,
    };

    setRecurringTransactions([...recurringTransactions, newRecurring]);
    resetForm();
    setShowAddModal(false);
    showSnackbar({ message: 'Recurring created' });
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setType('expense');
    setPattern('monthly');
    setStartDate(new Date());
    setHasEndDate(false);
    setEndDate(undefined);
    const defaultCategory = categories.find((c) => c.type === 'expense');
    setSelectedCategory(defaultCategory);
  };

  const handleToggleActive = (id: string) => {
    setRecurringTransactions(
      recurringTransactions.map((t) =>
        t.id === id ? { ...t, active: !t.active } : t
      )
    );
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringTransactions(recurringTransactions.filter((t) => t.id !== id));
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const getPatternLabel = (pattern: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return labels[pattern] || pattern;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Recurring Transactions</Text>
          <Text style={styles.subtitle}>Set up automatic recurring payments</Text>
        </View>

        {recurringTransactions.length > 0 ? (
          recurringTransactions.map((recurring) => (
            <View
              key={recurring.id}
              style={[
                styles.recurringItem,
                !recurring.active && styles.recurringItemInactive,
              ]}
            >
              <View style={styles.recurringHeader}>
                <View style={styles.recurringInfo}>
                  <Text style={styles.recurringCategory}>
                    {getCategoryName(recurring.categoryId)}
                  </Text>
                  {recurring.description && (
                    <Text style={styles.recurringDescription}>
                      {recurring.description}
                    </Text>
                  )}
                </View>
                <Switch
                  value={recurring.active}
                  onValueChange={() => handleToggleActive(recurring.id)}
                />
              </View>
              <View style={styles.recurringDetails}>
                <Text style={styles.recurringDetail}>
                  ${recurring.amount.toFixed(2)} • {getPatternLabel(recurring.pattern)}
                </Text>
                <Text style={styles.recurringDate}>
                  From {recurring.startDate}
                  {recurring.endDate && ` to ${recurring.endDate}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteRecurring(recurring.id)}
                style={styles.deleteRecurringButton}
              >
                <Text style={styles.deleteRecurringText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔄</Text>
            <Text style={styles.emptyText}>No recurring transactions</Text>
            <Text style={styles.emptySubtext}>
              Create recurring transactions for regular expenses
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Recurring</Text>
      </TouchableOpacity>

      {/* Add Recurring Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Recurring Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  {(['expense', 'income'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeButton,
                        type === t && styles.typeButtonActive,
                      ]}
                      onPress={() => {
                        setType(t);
                        const cat = categories.find((c) => c.type === t);
                        setSelectedCategory(cat);
                      }}
                    >
                      <Text style={styles.typeButtonText}>
                        {t === 'expense' ? 'Expense' : 'Income'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category */}
              <View style={styles.section}>
                <CategoryPicker
                  categories={categories}
                  selectedId={selectedCategory?.id}
                  onSelect={setSelectedCategory}
                  type={type}
                />
              </View>

              {/* Amount */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Amount</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#8997B3"
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  placeholder="e.g., Monthly subscription"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#8997B3"
                />
              </View>

              {/* Pattern */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Frequency</Text>
                <View style={styles.patternSelector}>
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.patternButton,
                        pattern === p && styles.patternButtonActive,
                      ]}
                      onPress={() => setPattern(p)}
                    >
                      <Text
                        style={[
                          styles.patternButtonText,
                          pattern === p && styles.patternButtonTextActive,
                        ]}
                      >
                        {getPatternLabel(p)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Start Date */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    📅 {startDate.toLocaleDateString('en-US')}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      setShowDatePicker(false);
                      if (date) setStartDate(date);
                    }}
                  />
                )}
              </View>

              {/* End Date Toggle */}
              <View style={styles.section}>
                <View style={styles.toggleRow}>
                  <Text style={styles.sectionLabel}>Set End Date?</Text>
                  <Switch value={hasEndDate} onValueChange={setHasEndDate} />
                </View>

                {hasEndDate && (
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      📅 {endDate?.toLocaleDateString('en-US')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddRecurring}
              >
                <Text style={styles.submitButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#141B2D',
    borderBottomWidth: 1,
    borderBottomColor: '#2B3654',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F7FB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#C7D2E5',
  },
  recurringItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recurringItemInactive: {
    opacity: 0.6,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recurringInfo: {
    flex: 1,
  },
  recurringCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  recurringDescription: {
    fontSize: 12,
    color: '#C7D2E5',
    marginTop: 4,
  },
  recurringDetails: {
    gap: 4,
    marginBottom: 12,
  },
  recurringDetail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  recurringDate: {
    fontSize: 12,
    color: '#8997B3',
  },
  deleteRecurringButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#3A171B',
    alignSelf: 'flex-start',
  },
  deleteRecurringText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F7FB',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8997B3',
  },
  addButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: '#7C8CFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#141B2D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141B2D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B3654',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#8997B3',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2B3654',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C7D2E5',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#7C8CFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#141B2D',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#F5F7FB',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#141B2D',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#7C8CFF',
    borderColor: '#7C8CFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C7D2E5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C7D2E5',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F5F7FB',
  },
  descriptionInput: {
    backgroundColor: '#141B2D',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  patternSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  patternButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#141B2D',
  },
  patternButtonActive: {
    backgroundColor: '#7C8CFF',
    borderColor: '#7C8CFF',
  },
  patternButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C7D2E5',
  },
  patternButtonTextActive: {
    color: '#141B2D',
  },
  dateButton: {
    backgroundColor: '#141B2D',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#7C8CFF',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
