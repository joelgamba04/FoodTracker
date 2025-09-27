import React from 'react';
import { View, Text } from 'react-native';
import { RecommendedIntake, Nutrient } from '@/models/models';

// Example recommended daily intake values
const recommended: RecommendedIntake[] = [
  { nutrient: 'Calories', amount: 2000, unit: 'kcal' },
  { nutrient: 'Protein', amount: 50, unit: 'g' },
  { nutrient: 'Carbs', amount: 275, unit: 'g' },
  { nutrient: 'Fat', amount: 70, unit: 'g' },
  { nutrient: 'Vitamin C', amount: 90, unit: 'mg' },
];

// This would be replaced by calculated totals in a real app
const todayTotals: Nutrient[] = [];

function getLackingNutrients(totals: Nutrient[], recommended: RecommendedIntake[]) {
  return recommended.filter(rec => {
    const total = totals.find(n => n.name === rec.nutrient);
    return !total || total.amount < rec.amount;
  });
}

export default function RecommendationsScreen() {
  const lacking = getLackingNutrients(todayTotals, recommended);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Nutrient Recommendations</Text>
      {lacking.length === 0 ? (
        <Text>You've met all recommended intakes today!</Text>
      ) : (
        lacking.map(nutrient => (
          <Text key={nutrient.nutrient}>
            You need more {nutrient.nutrient} ({nutrient.amount} {nutrient.unit} recommended)
          </Text>
        ))
      )}
    </View>
  );
}
