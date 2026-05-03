import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/src/shared/formatting/formatters';

interface DashboardCardProps {
  title: string;
  amount: number;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export function DashboardCard({
  title,
  amount,
  icon,
  color = '#60A5FA',
  subtitle,
}: DashboardCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.amount, { color }]}>{formatCurrency(amount)}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121826',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
