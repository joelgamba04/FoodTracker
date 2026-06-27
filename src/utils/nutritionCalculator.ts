// utils/nutritionCalculator.ts

import { FoodItem } from "@/models/models";

export const calculateNutrition = (
  food: FoodItem,
  qty: number,
  useGrams: boolean,
) => {
  const baseGrams = food.serving.grams || 100;

  const totalGrams = useGrams ? qty / 100 : qty * baseGrams;
  const factor = baseGrams ? totalGrams / baseGrams : qty;

  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
  };
};
