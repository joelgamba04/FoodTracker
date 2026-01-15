// src/mappers/foodMapper.ts
import { FoodDetail } from "@/models/foodModels";
import { Food } from "@/models/models";

export function mapFoodDetailToFood(item: FoodDetail): Food {
  const defaultMeasure =
    item.measures?.find((m) => m.is_default === 1) ?? item.measures?.[0];

  const servingSize =
    defaultMeasure?.measure_label && defaultMeasure?.weight_g
      ? `${defaultMeasure.measure_label} (${Number(defaultMeasure.weight_g)}g)`
      : defaultMeasure?.measure_label ?? "1 serving";

  return {
    id: String(item.food_id),
    name: item.filipino_name,
    englishName: item.english_name,
    servingSize,
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
  };
}
