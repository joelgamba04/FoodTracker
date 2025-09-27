import React from 'react';
import { View, Text } from 'react-native';
import { RecommendedIntake, Nutrient, FoodLogEntry } from '@/models/models';
import { USDA_RDI } from '@/constants/usdaRDI';

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

function getLackingNutrients(totals: Nutrient[], recommended: RecommendedIntake[]) {
  return recommended.filter(rec => {
    const total = totals.find(n => n.name === rec.nutrient);
    return !total || total.amount < rec.amount;
  });
}

function getExcessiveNutrients(totals: Nutrient[], recommended: RecommendedIntake[]) {
  return recommended.filter(rec => {
    const total = totals.find(n => n.name === rec.nutrient);
    return total && total.amount > rec.amount;
  });
}

export default function RecommendationsScreen() {
  const totals = calculateTotals(todayLog);
  const lacking = getLackingNutrients(totals, USDA_RDI);
  const excessive = getExcessiveNutrients(totals, USDA_RDI);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Nutrient Recommendations</Text>
      {lacking.length === 0 && excessive.length === 0 ? (
        <Text>You've met all recommended intakes today!</Text>
      ) : (
        <>
          {lacking.length > 0 && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 8 }}>You need more of:</Text>
              {lacking.map(nutrient => (
                <Text key={nutrient.nutrient}>
                  {nutrient.nutrient} ({nutrient.amount} {nutrient.unit} recommended)
                </Text>
              ))}
            </>
          )}
          {excessive.length > 0 && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 8 }}>You are exceeding:</Text>
              {excessive.map(nutrient => (
                <Text key={nutrient.nutrient}>
                  {nutrient.nutrient} ({nutrient.amount} {nutrient.unit} recommended)
                </Text>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
}
