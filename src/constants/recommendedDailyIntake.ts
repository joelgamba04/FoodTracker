import { Nutrient } from "@/models/models";

// --- RDI Data (Kept as is) ---
export const ARBITRARY_RDI: Record<string, Nutrient> = {
  Calories: { name: "Calories", amount: 2530, unit: "kcal" },
  Protein: { name: "Protein", amount: 95, unit: "g" },
  Carbohydrate: { name: "Carbohydrate", amount: 380, unit: "g" },
  Fat: { name: "Fat", amount: 70, unit: "g" },
  Water: { name: "Water", amount: 2530, unit: "ml" },
};
