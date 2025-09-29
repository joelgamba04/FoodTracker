import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Nutrient } from '@/models/models';
import { useFoodLog } from '@/context/FoodLogContext';

function calculateTotals(log: any[]): Nutrient[] {
  const totals: { [key: string]: Nutrient } = {};
  log.forEach(entry => {
    entry.food.nutrients.forEach((nutrient: Nutrient) => {
      if (!totals[nutrient.name]) {
        totals[nutrient.name] = { ...nutrient, amount: 0 };
      }
      totals[nutrient.name].amount += nutrient.amount * entry.quantity;
    });
  });
  return Object.values(totals);
}

export default function SummaryScreen() {
  const { log } = useFoodLog();
  const totals = calculateTotals(log);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today's Nutrient Summary</Text>
      {totals.length === 0 ? (
        <Text style={styles.emptyText}>No foods logged yet.</Text>
      ) : (
        totals.map(nutrient => (
          <Text key={nutrient.name} style={styles.nutrientText}>
            {nutrient.name}: {nutrient.amount} {nutrient.unit}
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  emptyText: {
    color: '#757575',
  },
  nutrientText: {
    color: '#333',
    marginBottom: 4,
  },
});