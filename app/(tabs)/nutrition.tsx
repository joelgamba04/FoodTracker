import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFoodLog } from '@/context/FoodLogContext';
import { Nutrient } from '@/models/models';

const ARBITRARY_RDI: Record<string, Nutrient> = {
  Calories: { name: 'Calories', amount: 2000, unit: 'kcal' },
  Protein: { name: 'Protein', amount: 50, unit: 'g' },
  Carbohydrate: { name: 'Carbohydrate', amount: 300, unit: 'g' },
  Fat: { name: 'Fat', amount: 70, unit: 'g' },
  Fiber: { name: 'Fiber', amount: 30, unit: 'g' },
  Calcium: { name: 'Calcium', amount: 1000, unit: 'mg' },
  Iron: { name: 'Iron', amount: 18, unit: 'mg' },
};

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

function getBarColor(percent: number) {
  if (percent > 1.2) return '#d32f2f'; // Overeating
  if (percent < 0.6) return '#fbc02d'; // Severely lacking
  return '#388e3c'; // Normal
}

export default function NutritionScreen() {
  const { log } = useFoodLog();
  const totals = calculateTotals(log);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Today's Nutrition Summary & Recommendations</Text>
      {/* Calories Bar Chart */}
      <Text style={styles.sectionHeading}>Calories</Text>
      {(() => {
        const recommended = ARBITRARY_RDI['Calories'].amount;
        const consumed = totals.find(n => n.name === 'Calories')?.amount || 0;
        const percent = consumed / recommended;
        const barWidth = Math.min(percent, 2) * 200;
        const color = getBarColor(percent);
        return (
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>
              {consumed.toFixed(0)}/{recommended} kcal
            </Text>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.bar,
                  {
                    width: barWidth,
                    backgroundColor: color,
                  },
                ]}
              />
              <View
                style={[
                  styles.marker,
                  { left: 200 },
                ]}
              />
            </View>
            {percent > 1.2 && (
              <Text style={styles.excessiveText}>Over recommended!</Text>
            )}
            {percent < 0.6 && (
              <Text style={styles.lackingText}>Severely lacking!</Text>
            )}
          </View>
        );
      })()}
      {/* Nutrients Summary */}
      <Text style={styles.sectionHeading}>Nutrients</Text>
      {totals.length === 0 ? (
        <Text style={styles.emptyText}>No foods logged yet.</Text>
      ) : (
        Object.keys(ARBITRARY_RDI).filter(n => n !== 'Calories').map(name => {
          const recommended = ARBITRARY_RDI[name].amount;
          const consumed = totals.find(nutrient => nutrient.name === name)?.amount || 0;
          const percent = consumed / recommended;
          const barWidth = Math.min(percent, 2) * 200;
          const color = getBarColor(percent);

          return (
            <View key={name} style={styles.nutrientRow}>
              <Text style={styles.nutrientLabel}>
                {name}: {consumed.toFixed(1)}/{recommended} {ARBITRARY_RDI[name].unit}
              </Text>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      backgroundColor: color,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.marker,
                    { left: 200 },
                  ]}
                />
              </View>
              {percent > 1.2 && (
                <Text style={styles.excessiveText}>Over recommended!</Text>
              )}
              {percent < 0.6 && (
                <Text style={styles.lackingText}>Severely lacking!</Text>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
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
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388e3c',
    marginTop: 16,
    marginBottom: 8,
  },
  nutrientRow: {
    marginBottom: 32,
  },
  nutrientLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  barBackground: {
    width: 220,
    height: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 20,
    backgroundColor: '#1976d2',
    borderRadius: 1,
  },
  excessiveText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    marginTop: 2,
  },
  lackingText: {
    color: '#fbc02d',
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyText: {
    color: '#757575',
    marginTop: 8,
  },
});