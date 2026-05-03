import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { generateId } from '@/src/shared/ids/id-generator';
import { Budget } from '@/src/domain/money/types';

export default function BudgetsScreen() {
  const { categories } = useMoneyTracker();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  const handleAddBudget = () => {
    if (!selectedCategory || !budgetAmount) {
      Alert.alert('Error', 'Please select a category and enter a budget amount');
      return;
    }

    const existingBudgetIndex = budgets.findIndex(
      (b) => b.categoryId === selectedCategory
    );

    const newBudget: Budget = {
      id: generateId(),
      categoryId: selectedCategory,
      limitAmount: parseFloat(budgetAmount),
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    };

    if (existingBudgetIndex >= 0) {
      const updated = [...budgets];
      updated[existingBudgetIndex] = newBudget;
      setBudgets(updated);
    } else {
      setBudgets([...budgets, newBudget]);
    }

    setSelectedCategory(null);
    setBudgetAmount('');
    setShowAddModal(false);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget Goals</Text>
          <Text style={styles.subtitle}>Set spending limits for each category</Text>
        </View>

        {budgets.length > 0 ? (
          budgets.map((budget) => (
            <View key={budget.id} style={styles.budgetItem}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetCategory}>
                  {getCategoryName(budget.categoryId)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteBudget(budget.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetLimit}>
                  Budget: ${budget.limitAmount.toFixed(2)}
                </Text>
                <Text style={styles.budgetMonth}>{budget.month}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No budget goals yet</Text>
            <Text style={styles.emptySubtext}>
              Set budget goals to track your spending limits
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Budget Goal</Text>
      </TouchableOpacity>

      {/* Add Budget Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Budget Goal</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {expenseCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category.id &&
                          styles.categoryOptionSelected,
                        { borderColor: category.color },
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text style={styles.categoryOptionIcon}>
                        {category.icon}
                      </Text>
                      <Text style={styles.categoryOptionName}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Monthly Limit</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addBudgetButton}
                onPress={handleAddBudget}
              >
                <Text style={styles.addBudgetButtonText}>Add Budget</Text>
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
    backgroundColor: '#090D14',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#121826',
    borderBottomWidth: 1,
    borderBottomColor: '#263244',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  budgetItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#121826',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#60A5FA',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 18,
    color: '#94A3B8',
  },
  budgetInfo: {
    gap: 4,
  },
  budgetLimit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  budgetMonth: {
    fontSize: 12,
    color: '#94A3B8',
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
    color: '#F8FAFC',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  addButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: '#60A5FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121826',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121826',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#263244',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#94A3B8',
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
    borderTopColor: '#263244',
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
    color: '#CBD5E1',
  },
  addBudgetButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#60A5FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  addBudgetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121826',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#F8FAFC',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#121826',
  },
  categoryOptionSelected: {
    backgroundColor: '#1E3A5F',
  },
  categoryOptionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryOptionName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CBD5E1',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F8FAFC',
  },
});
