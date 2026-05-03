import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMoneyTracker } from '@/src/composition/use-money-tracker';
import { generateId } from '@/src/shared/ids/id-generator';
import { Transaction } from '@/src/domain/money/types';

export default function AddTransactionScreen() {
  const { categories, addTransaction } = useMoneyTracker();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find((c) => c.type === type)
  );
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (event: any, selectedDate: any) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Please enter amount and select category');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      const transaction: Transaction = {
        id: generateId(),
        categoryId: selectedCategory.id,
        amount: parseFloat(amount),
        description,
        date: date.toISOString().split('T')[0],
        type,
      };

      await addTransaction(transaction);
      Alert.alert('Success', 'Transaction added successfully');
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date());
    const defaultCategory = categories.find((c) => c.type === type);
    setSelectedCategory(defaultCategory);
  };

  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    const defaultCategory = categories.find((c) => c.type === newType);
    setSelectedCategory(defaultCategory);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const filteredCategories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* AMOUNT - Primary Focus */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountInputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#94A3B8"
              autoFocus
            />
          </View>
        </View>

        {/* TYPE SELECTOR */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButtonWide,
              type === 'expense' && styles.typeButtonWideActive,
            ]}
            onPress={() => handleTypeChange('expense')}
          >
            <Text style={styles.typeButtonWideEmoji}>💸</Text>
            <View>
              <Text style={[
                styles.typeButtonWideLabel,
                type === 'expense' && styles.typeButtonWideTextActive
              ]}>
                Expense
              </Text>
              <Text style={styles.typeButtonWideSubtext}>Money spent</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButtonWide,
              type === 'income' && styles.typeButtonWideActive,
            ]}
            onPress={() => handleTypeChange('income')}
          >
            <Text style={styles.typeButtonWideEmoji}>💰</Text>
            <View>
              <Text style={[
                styles.typeButtonWideLabel,
                type === 'income' && styles.typeButtonWideTextActive
              ]}>
                Income
              </Text>
              <Text style={styles.typeButtonWideSubtext}>Money earned</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CATEGORY SELECTOR */}
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <View style={styles.categoryButtonContent}>
            <View style={styles.categoryButtonLeft}>
              <Text style={styles.categoryButtonEmoji}>{selectedCategory?.icon}</Text>
              <View>
                <Text style={styles.categoryButtonLabel}>Category</Text>
                <Text style={styles.categoryButtonValue}>{selectedCategory?.name}</Text>
              </View>
            </View>
            <Text style={styles.categoryButtonArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* QUICK ACTIONS - Date & Description */}
        {showDetails && (
          <>
            {/* Date Picker */}
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.detailButtonIcon}>📅</Text>
              <View style={styles.detailButtonContent}>
                <Text style={styles.detailButtonLabel}>Date</Text>
                <Text style={styles.detailButtonValue}>
                  {date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Description */}
            <View style={styles.detailButton}>
              <Text style={styles.detailButtonIcon}>📝</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add note..."
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </>
        )}

        {/* Toggle Details */}
        <TouchableOpacity
          style={styles.toggleDetailsButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.toggleDetailsText}>
            {showDetails ? '▼ Hide Details' : '▲ Add Details'}
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleAddTransaction}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Adding...' : 'Save Transaction'}
          </Text>
        </TouchableOpacity>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.categoriesGrid}>
                {filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryGridItem,
                      selectedCategory?.id === category.id && styles.categoryGridItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={styles.categoryGridEmoji}>{category.icon}</Text>
                    <Text style={styles.categoryGridName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D14',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  // AMOUNT SECTION - HERO SECTION
  amountSection: {
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 20,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  currencySymbol: {
    fontSize: 44,
    fontWeight: '700',
    color: '#60A5FA',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '700',
    color: '#F8FAFC',
    paddingVertical: 20,
  },
  // TYPE SELECTOR - HORIZONTAL CARDS
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButtonWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#263244',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  typeButtonWideActive: {
    borderColor: '#60A5FA',
    borderWidth: 2.5,
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  typeButtonWideEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  typeButtonWideLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 2,
  },
  typeButtonWideTextActive: {
    color: '#60A5FA',
  },
  typeButtonWideSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // CATEGORY SELECTOR
  categoryButton: {
    backgroundColor: '#121826',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#60A5FA',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryButtonEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryButtonLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  categoryButtonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  categoryButtonArrow: {
    fontSize: 28,
    color: '#60A5FA',
    fontWeight: '700',
  },
  // DETAIL BUTTONS
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#263244',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  detailButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  detailButtonContent: {
    flex: 1,
  },
  detailButtonLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  detailButtonValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  descriptionInput: {
    flex: 1,
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '500',
    padding: 0,
  },
  // TOGGLE DETAILS
  toggleDetailsButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
  },
  // SUBMIT BUTTON
  submitButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121826',
    letterSpacing: 0.3,
  },
  // MODAL
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121826',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalClose: {
    fontSize: 24,
    color: '#94A3B8',
    fontWeight: '500',
  },
  categoriesGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#090D14',
    borderWidth: 1,
    borderColor: '#263244',
  },
  categoryGridItemSelected: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  categoryGridEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryGridName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
});
