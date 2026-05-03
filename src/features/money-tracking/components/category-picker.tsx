import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Category } from '@/src/domain/money/types';

interface CategoryPickerProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (category: Category) => void;
  type?: 'expense' | 'income';
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  type,
}: CategoryPickerProps) {
  const filtered = type
    ? categories.filter((cat) => cat.type === type)
    : categories;

  const [maxWidth, setMaxWidth] = useState(0);

  const handleLayout = (e: any) => {
    const { width } = e.nativeEvent.layout;
    if (width > maxWidth) {
      setMaxWidth(width);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {filtered.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              { width: maxWidth || undefined },
              selectedId === category.id && styles.categoryButtonSelected,
            ]}
            onLayout={handleLayout}
            onPress={() => onSelect(category)}
          >
            <View
              style={[
                styles.iconBackground,
                { 
                  backgroundColor: category.color + '20',
                },
                selectedId === category.id && { 
                  backgroundColor: category.color + '30',
                },
              ]}
            >
              <Text style={styles.icon}>{category.icon}</Text>
            </View>
            <Text
              style={[
                styles.name,
                selectedId === category.id && styles.nameSelected,
              ]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            {selectedId === category.id && (
              <View
                style={[
                  styles.selectedIndicator,
                  { backgroundColor: category.color },
                ]}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: '#F5F7FB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flexGrow: 0,
  },
  categoryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: '#141B2D',
    borderWidth: 1,
    borderColor: '#2B3654',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonSelected: {
    borderColor: '#7C8CFF',
    borderWidth: 1.5,
    shadowColor: '#7C8CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C7D2E5',
    flexWrap: 'nowrap',
    textAlign: 'center',
  },
  nameSelected: {
    color: '#F5F7FB',
    fontWeight: '700',
  },
  selectedIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
