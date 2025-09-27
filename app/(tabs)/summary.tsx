import React from 'react';
import { View, Text } from 'react-native';
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
