import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
// ...existing imports...

const DEFAULT_RDI = {
  Calories: { name: 'Calories', amount: 2000, unit: 'kcal' },
  Protein: { name: 'Protein', amount: 50, unit: 'g' },
  Carbohydrate: { name: 'Carbohydrate', amount: 300, unit: 'g' },
  Fat: { name: 'Fat', amount: 70, unit: 'g' },
  Fiber: { name: 'Fiber', amount: 30, unit: 'g' },
  Calcium: { name: 'Calcium', amount: 1000, unit: 'mg' },
  Iron: { name: 'Iron', amount: 18, unit: 'mg' },
};

type NutrientKey = keyof typeof DEFAULT_RDI;
type ProfileField = 'age' | 'height' | 'weight' | 'illness' | 'medicines';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    age: '',
    height: '',
    weight: '',
    illness: 'None',
    medicines: '',
  });

  const [rdi, setRdi] = useState(DEFAULT_RDI);

  const handleProfileChange = (field: ProfileField, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIllnessChange = (illness: string) => {
    setProfile(prev => ({
      ...prev,
      illness,
    }));

    // Adjust RDI based on illness
    if (illness !== 'None' && illnessRdiAdjustments[illness]) {
      setRdi(prevRdi => {
        const adjustments = illnessRdiAdjustments[illness];
        const newRdi = { ...prevRdi };
        (Object.keys(adjustments) as NutrientKey[]).forEach(nutrient => {
          if (newRdi[nutrient]) {
            newRdi[nutrient].amount = adjustments[nutrient]!;
          }
        });
        return newRdi;
      });
    } else {
      setRdi(DEFAULT_RDI);
    }
  };

  const handleSave = () => {
    // TODO: Save profile and RDI to context or persistent storage
    alert('Profile and RDI updated! (Implement persistence for real use)');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Age:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={profile.age}
          onChangeText={val => handleProfileChange('age', val)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Height (cm):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={profile.height}
          onChangeText={val => handleProfileChange('height', val)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Weight (kg):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={profile.weight}
          onChangeText={val => handleProfileChange('weight', val)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Medical Illness:</Text>
        <View style={styles.pickerContainer}>
          {illnesses.map(ill => (
            <Button
              key={ill}
              title={ill}
              color={profile.illness === ill ? '#1976d2' : '#ccc'}
              onPress={() => handleIllnessChange(ill)}
            />
          ))}
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Maintenance Medicines:</Text>
        <TextInput
          style={styles.input}
          value={profile.medicines}
          onChangeText={val => handleProfileChange('medicines', val)}
          placeholder="List medicines"
        />
      </View>
      <Text style={styles.sectionHeading}>Adjusted RDI</Text>
      {(Object.keys(rdi) as NutrientKey[]).map(key => (
        <View key={key} style={styles.rdiRow}>
          <Text style={styles.rdiLabel}>
            {key}: {rdi[key].amount} {rdi[key].unit}
          </Text>
        </View>
      ))}
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388e3c',
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#1976d2',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  rdiRow: {
    marginBottom: 8,
  },
  rdiLabel: {
    color: '#333',
  },
});