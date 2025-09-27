import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { Food, FoodLogEntry } from '@/models/models';
import { searchFoods } from '@/utils/foodApi';

export default function LogScreen() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [log, setLog] = useState<FoodLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const foods = await searchFoods(search);
    setResults(foods);
    setLoading(false);
  };

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
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search for food..."
        style={{ borderWidth: 1, padding: 8, marginVertical: 8 }}
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
