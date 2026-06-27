// src/mappers/foodMapper.ts
import { FoodDetail } from "@/models/foodModels";
import { Food, FoodItem } from "@/models/models";

export const mapFoodDetailToFood = (item: FoodDetail): Food => {
  const defaultMeasure =
    item.measures?.find((m) => m.is_default === 1) ?? item.measures?.[0];

  const servingSize =
    defaultMeasure?.measure_label && defaultMeasure?.weight_g
      ? `${defaultMeasure.measure_label} (${Number(defaultMeasure.weight_g)}g)`
      : (defaultMeasure?.measure_label ?? "1 serving");

  return {
    id: String(item.food_id),
    name: item.filipino_name || item.english_name || "Unknown food",
    englishName: item.english_name || "",
    servingSize,
    category: item.category_name,
    nutrients: [
      { name: "Calories", unit: "kcal", amount: Number(item.energy_kcal ?? 0) },
      {
        name: "Carbohydrate",
        unit: "g",
        amount: Number(item.carbohydrate_g ?? 0),
      },
      { name: "Protein", unit: "g", amount: Number(item.protein_g ?? 0) },
      { name: "Fat", unit: "g", amount: Number(item.fat_g ?? 0) },
    ],
    measures: item.measures ?? [],
  };
};

export const mapFoodDetailToFoodItem = (f: FoodDetail): FoodItem => {
  const defaultMeasure =
    f.measures?.find((m) => m.is_default === 1) ?? f.measures?.[0];

  const grams = Number(defaultMeasure?.weight_g ?? 0);

  const safeLabel = defaultMeasure?.measure_label?.trim();

  return {
    id: f.food_id,
    name: f.filipino_name,
    english_name: f.english_name ?? "",

    calories: Number(f.energy_kcal),
    protein: Number(f.protein_g),
    fat: Number(f.fat_g),
    carbs: Number(f.carbohydrate_g),

    serving: {
      label: safeLabel && safeLabel.length > 0 ? safeLabel : "1 serving",

      grams: Number(defaultMeasure?.weight_g ?? 0),
      dimension: defaultMeasure?.dimension_ep ?? "",
      isDefault: defaultMeasure?.is_default === 1,
    },
  };
};
