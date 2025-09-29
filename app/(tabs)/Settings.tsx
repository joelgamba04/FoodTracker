import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

// Default RDI values
const DEFAULT_RDI = {
  Calories: { name: 'Calories', amount: 2000, unit: 'kcal' },
  Protein: { name: 'Protein', amount: 50, unit: 'g' },
  Carbohydrate: { name: 'Carbohydrate', amount: 300, unit: 'g' },
  Fat: { name: 'Fat', amount: 70, unit: 'g' },
  Fiber: { name: 'Fiber', amount: 30, unit: 'g' },
  Calcium: { name: 'Calcium', amount: 1000, unit: 'mg' },
  Iron: { name: 'Iron', amount: 18, unit: 'mg' },
};

export default function SettingsScreen({ route, navigation }: any) {
  // You should lift this state up to a context/provider for app-wide use!
  const [rdi, setRdi] = useState(DEFAULT_RDI);
  type RdiKey = keyof typeof DEFAULT_RDI;

  const handleChange = (name: RdiKey, value: string) => {
    setRdi(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        amount: Number(value),
      },
    }));
  };

  const handleSave = () => {
    // TODO: Save to context/global state or persistent storage
    alert('RDI values saved! (Implement persistence for real use)');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Edit Recommended Daily Intake</Text>
      {Object.keys(rdi).map(name => {
        const key = name as RdiKey;
        return (
            <View key={key} style={styles.row}>
            <Text style={styles.label}>{key} ({rdi[key].unit}):</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={rdi[key].amount.toString()}
                onChangeText={val => handleChange(key, val)}
            />
            </View>
        );
        })}
      <Button title="Save" onPress={handleSave} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    flex: 1,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: '#fff',
    color: '#1976d2',
  },
});