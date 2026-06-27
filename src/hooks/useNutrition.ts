// hooks/useNutrition.ts
import { FoodItem } from "@/models/models";
import { useMemo } from "react";

export const useNutrition = (
  food: FoodItem | null,
  qty: number = 1,
  useGrams: boolean = false,
  grams: number = 0,
) => {
  return useMemo(() => {
    if (!food) return { calories: 0, protein: 0, fat: 0, carbs: 0 };

    const baseGrams = food.serving?.grams ?? 100;

    const totalGrams = useGrams ? grams : qty * baseGrams;

    const factor = baseGrams ? totalGrams / baseGrams : qty;

    return {
      calories: Math.round((food.calories ?? 0) * factor),
      protein: Math.round((food.protein ?? 0) * factor * 10) / 10,
      fat: Math.round((food.fat ?? 0) * factor * 10) / 10,
      carbs: Math.round((food.carbs ?? 0) * factor * 10) / 10,
    };
  }, [food, qty, useGrams, grams]);
};
