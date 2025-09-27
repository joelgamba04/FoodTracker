import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { Food, FoodLogEntry } from '@/models/models';

// Placeholder foods for demo
const sampleFoods: Food[] = [
  {
    id: '1',
    name: 'Apple',
    servingSize: '1 medium',
    nutrients: [
      { name: 'Calories', unit: 'kcal', amount: 95 },
      { name: 'Carbs', unit: 'g', amount: 25 },
      { name: 'Fiber', unit: 'g', amount: 4.4 },
      { name: 'Vitamin C', unit: 'mg', amount: 8.4 },
    ],
  },
  {
    id: '2',
    name: 'Egg',
    servingSize: '1 large',
    nutrients: [
      { name: 'Calories', unit: 'kcal', amount: 78 },
      { name: 'Protein', unit: 'g', amount: 6 },
      { name: 'Fat', unit: 'g', amount: 5 },
    ],
  },
];

export default function LogScreen() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [log, setLog] = useState<FoodLogEntry[]>([]);

  const addFoodToLog = () => {
    if (selectedFood) {
      setLog([...log, { food: selectedFood, quantity: Number(quantity) }]);
      setSelectedFood(null);
      setQuantity('1');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Log Food</Text>
      <FlatList
        data={sampleFoods}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Button title={item.name} onPress={() => setSelectedFood(item)} />
        )}
      />
      {selectedFood && (
        <View style={{ marginTop: 16 }}>
          <Text>Selected: {selectedFood.name}</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 8, marginVertical: 8 }}
            placeholder="Quantity"
          />
          <Button title="Add to Log" onPress={addFoodToLog} />
        </View>
      )}
      <Text style={{ marginTop: 24, fontWeight: 'bold' }}>Today's Log:</Text>
      <FlatList
        data={log}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <Text>
            {item.quantity} x {item.food.name} ({item.food.servingSize})
          </Text>
        )}
      />
    </View>
  );
}
