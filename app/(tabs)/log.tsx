import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { Food, FoodLogEntry } from '@/models/models';
import { searchFoods } from '@/utils/foodApi';
import { useFoodLog } from '@/context/FoodLogContext';

export default function LogScreen() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const { log, addEntry } = useFoodLog();

  const handleSearch = async () => {
    setLoading(true);
    const foods = await searchFoods(search);
    setResults(foods);
    setLoading(false);
  };

  const addFoodToLog = () => {
    if (selectedFood) {
      addEntry({ food: selectedFood, quantity: Number(quantity) });
      setSelectedFood(null);
      setQuantity('1');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Log Food</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search for food..."
        style={styles.input}
      />
      <Button title="Search" onPress={handleSearch} disabled={loading} />
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Button title={item.name} onPress={() => setSelectedFood(item)} />
        )}
      />
      {selectedFood && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>Selected: {selectedFood.name}</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.input}
            placeholder="Quantity"
          />
          <Button title="Add to Log" onPress={addFoodToLog} />
        </View>
      )}
      <Text style={styles.logHeading}>Today's Log:</Text>
      <FlatList
        data={log}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <Text style={styles.logItem}>
            {item.quantity} x {item.food.name} ({item.food.servingSize})
          </Text>
        )}
      />
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
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginVertical: 8,
  },
  selectedContainer: {
    marginTop: 16,
  },
  selectedText: {
    color: '#388e3c',
  },
  logHeading: {
    marginTop: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  logItem: {
    color: '#333',
  },
});