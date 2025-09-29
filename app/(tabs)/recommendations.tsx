import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFoodLog } from '@/context/FoodLogContext';
import { Nutrient } from '@/models/models';

// Arbitrary recommended daily intake values
const ARBITRARY_RDI: Record<string, Nutrient> = {
  Protein: { name: 'Protein', amount: 50, unit: 'g' },
  Carbohydrate: { name: 'Carbohydrate', amount: 300, unit: 'g' },
  Fat: { name: 'Fat', amount: 70, unit: 'g' },
  Fiber: { name: 'Fiber', amount: 30, unit: 'g' },
  Calcium: { name: 'Calcium', amount: 1000, unit: 'mg' },
  Iron: { name: 'Iron', amount: 18, unit: 'mg' },
};

function getLackingNutrients(totals: Nutrient[], rdi: Record<string, Nutrient>) {
  return Object.keys(rdi)
    .filter(name => {
      const total = totals.find(n => n.name === name);
      return !total || total.amount < rdi[name].amount;
    })
    .map(name => ({
      name,
      recommended: rdi[name].amount,
      unit: rdi[name].unit,
      consumed: totals.find(n => n.name === name)?.amount || 0,
    }));
}

function getExcessiveNutrients(totals: Nutrient[], rdi: Record<string, Nutrient>) {
  return Object.keys(rdi)
    .filter(name => {
      const total = totals.find(n => n.name === name);
      return total && total.amount > rdi[name].amount;
    })
    .map(name => ({
      name,
      recommended: rdi[name].amount,
      unit: rdi[name].unit,
      consumed: totals.find(n => n.name === name)?.amount || 0,
    }));
}

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

export default function RecommendationsScreen() {
  const { log } = useFoodLog();
  const totals = calculateTotals(log);
  const lacking = getLackingNutrients(totals, ARBITRARY_RDI);
  const excessive = getExcessiveNutrients(totals, ARBITRARY_RDI);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Nutrient Recommendations</Text>
      {lacking.length === 0 && excessive.length === 0 ? (
        <Text style={styles.normalText}>You're meeting all recommended daily intakes!</Text>
      ) : (
        <>
          {lacking.length > 0 && (
            <>
              <Text style={styles.lackingHeading}>Lacking Nutrients:</Text>
              {lacking.map(nutrient => (
                <Text key={nutrient.name} style={styles.lackingText}>
                  {nutrient.name}: {nutrient.consumed}/{nutrient.recommended} {nutrient.unit}
                </Text>
              ))}
            </>
          )}
          {excessive.length > 0 && (
            <>
              <Text style={styles.excessiveHeading}>Excessive Nutrients:</Text>
              {excessive.map(nutrient => (
                <Text key={nutrient.name} style={styles.excessiveText}>
                  {nutrient.name}: {nutrient.consumed}/{nutrient.recommended} {nutrient.unit}
                </Text>
              ))}
            </>
          )}
        </>
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
  normalText: {
    color: '#388e3c',
  },
  lackingHeading: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#fbc02d',
  },
  lackingText: {
    color: '#fbc02d',
    marginBottom: 4,
  },
  excessiveHeading: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  excessiveText: {
    color: '#d32f2f',
    marginBottom: 4,
  },
});