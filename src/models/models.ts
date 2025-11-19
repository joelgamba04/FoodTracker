// Food, Nutrient, and DailyLog models for FoodTracker
// src/models/models.ts

export interface Nutrient {
  name: string; // e.g., Protein, Carbs, Fat, Vitamin C
  unit: string; // e.g., g, mg
  amount: number; // amount per serving
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  servingSize: string; // e.g., "100g", "1 cup"
  nutrients: Nutrient[];
}

export interface FoodLogEntry {
  id: string;
  timestamp: any;
  food: Food;
  quantity: number; // number of servings
}

export interface UserProfile {
  age: string;
  sex: string;
  height: string;
  weight: string;
}

export const defaultProfile: UserProfile = {
  age: "",
  sex: "Male",
  height: "",
  weight: "",
};