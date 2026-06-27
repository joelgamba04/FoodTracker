// Internal models for FoodTracker
// src/models/models.ts
import { FoodMeasure } from "./foodModels";
export type SyncStatus = "pending" | "synced" | "failed";

export interface Nutrient {
  name: string; // e.g., Protein, Carbs, Fat, Vitamin C
  unit: string; // e.g., g, mg
  amount: number; // amount per serving
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  servingSize: string; // e.g., "100g", "1 cup"
  nutrients: Nutrient[];
  englishName?: string; // Optional English name for the food
  measures: FoodMeasure[];
}

export interface FoodServing {
  label?: string;
  grams: number;
  dimension?: string;
}

export interface FoodItem {
  id: number;
  name: string;
  english_name?: string;
  category?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  serving: {
    label?: string;
    grams: number;
    dimension?: string;
    isDefault: boolean;
  };
}
export interface FoodLogEntry {
  localId: string;
  serverId?: number | null; // Optional server ID for syncing

  timestamp: number; // Unix timestamp in milliseconds
  food: FoodItem;
  quantity: number; // number of servings

  syncStatus: SyncStatus;
  lastSyncError?: string | null;
  serverMealId?: number | null;
  serverFoodEntryId?: number | null;
  mealType?: 1 | 2 | 3;

  useGrams: boolean;
  grams: number;
  nutrientSummary: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
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
