import { Nutrient } from "@/models/models";

// --- RDI Data (Kept as is) ---
export const ARBITRARY_RDI: Record<string, Nutrient> = {
  Calories: { name: "Calories", amount: 2000, unit: "kcal" },
  Protein: { name: "Protein", amount: 50, unit: "g" },
  Carbohydrate: { name: "Carbohydrate", amount: 300, unit: "g" },
  Fat: { name: "Fat", amount: 70, unit: "g" },
};
