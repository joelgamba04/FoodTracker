import React from 'react';
import { View, Text } from 'react-native';
import { FoodLogEntry, Nutrient } from '@/models/models';

// This would be replaced by context or state in a real app
const todayLog: FoodLogEntry[] = [];

function calculateTotals(log: FoodLogEntry[]): Nutrient[] {
  const totals: { [key: string]: Nutrient } = {};
  log.forEach(entry => {
    entry.food.nutrients.forEach(nutrient => {
      if (!totals[nutrient.name]) {
        totals[nutrient.name] = { ...nutrient, amount: 0 };
      }
      totals[nutrient.name].amount += nutrient.amount * entry.quantity;
    });
  });
  return Object.values(totals);
}

export default function SummaryScreen() {
  const totals = calculateTotals(todayLog);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Today's Nutrient Summary</Text>
      {totals.length === 0 ? (
        <Text>No foods logged yet.</Text>
      ) : (
        totals.map(nutrient => (
          <Text key={nutrient.name}>
            {nutrient.name}: {nutrient.amount} {nutrient.unit}
          </Text>
        ))
      )}
    </View>
  );
}
