// hooks/useNutrition.ts
import { FoodItem } from "@/models/models";
import { useMemo } from "react";

export type NutritionTotals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export const emptyNutrition: NutritionTotals = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

// Normal function: safe to use inside map(), reduce(), loops, etc.
export const calculateNutrition = (
  food: FoodItem | null,
  qty: number = 1,
  useGrams: boolean = false,
  grams: number = 0,
): NutritionTotals => {
  if (!food) return emptyNutrition;

  // const baseGrams = food.serving?.grams ?? 100;
  const baseGrams = 100;
  const totalGrams = useGrams ? grams : qty * baseGrams;
  const factor = baseGrams ? totalGrams / baseGrams : qty;

  return {
    calories: Math.round((food.calories ?? 0) * factor),
    protein: Math.round((food.protein ?? 0) * factor * 10) / 10,
    fat: Math.round((food.fat ?? 0) * factor * 10) / 10,
    carbs: Math.round((food.carbs ?? 0) * factor * 10) / 10,
  };
};;

// React hook: keep this for pages that calculate one selected food item.
export const useNutrition = (
  food: FoodItem | null,
  qty: number = 1,
  useGrams: boolean = false,
  grams: number = 0,
): NutritionTotals => {
  return useMemo(
    () => calculateNutrition(food, qty, useGrams, grams),
    [food, qty, useGrams, grams],
  );
};
