// src/lib/recommendedIntake.ts
import { ARBITRARY_RDI } from "@/constants/recommendedDailyIntake";
import { UserProfile } from "@/models/models";

export type NutrientKey = keyof typeof ARBITRARY_RDI;

export interface NutrientGoal {
  name: string;
  amount: number;
  unit: string;
}
/**
 * Very simple, documented heuristic based on sex, age, weight.
 * Replace with PDRI-based logic later when ready.
 */
export const calculateRecommendedIntake = (
  profile: UserProfile | null,
): Record<NutrientKey, NutrientGoal> => {
  // start from the static ARBITRARY_RDI as a template
  const base = ARBITRARY_RDI as Record<NutrientKey, NutrientGoal>;
  const rdi: Record<NutrientKey, NutrientGoal> = { ...base };

  if (!profile) return rdi;

  const age = parseInt(profile.age, 10);
  const weight = parseFloat(profile.weight);
  const sex = profile.sex || "Male";

  if (!Number.isFinite(age) || !Number.isFinite(weight) || weight <= 0) {
    return rdi;
  }

  let calories = 2530;
  let carbs = 380; // g
  let protein = 95; // g
  let fat = 70; // g
  let water = 2530; // ml

  if (sex === "Male") {
    if (age < 30) {
      calories = 2530;
      carbs = 380;
      protein = 95;
      fat = 70;
      water = 2530;
    } else if (age < 60) {
      calories = 2420;
      carbs = 363;
      protein = 91;
      fat = 67;
      water = 2420;
    }
  } else {
    if (age < 30) {
      calories = 1930;
      carbs = 290;
      protein = 73;
      fat = 54;
      water = 1930;
    } else if (age < 60) {
      calories = 1870;
      carbs = 281;
      protein = 70;
      fat = 52;
      water = 1870;
    }
  }

  if (base.Calories) {
    rdi.Calories = {
      ...base.Calories,
      amount: calories,
    };
  }

  if (base.Protein) {
    rdi.Protein = {
      ...base.Protein,
      amount: protein,
    };
  }

  if (base.Carbohydrate) {
    rdi.Carbohydrate = {
      ...base.Carbohydrate,
      amount: carbs,
    };
  }

  if (base.Fat) {
    rdi.Fat = {
      ...base.Fat,
      amount: fat,
    };
  }

  if (base.Water) {
    rdi.Water = {
      ...base.Water,
      amount: water,
    };
  }

  return rdi;
};
