// United States Recommended Daily Intake (RDI) values for adults
import { RecommendedIntake } from '@/models/models';

export const USDA_RDI: RecommendedIntake[] = [
  { nutrient: 'Calories', amount: 2000, unit: 'kcal' },
  { nutrient: 'Protein', amount: 50, unit: 'g' },
  { nutrient: 'Carbs', amount: 275, unit: 'g' },
  { nutrient: 'Fat', amount: 78, unit: 'g' },
  { nutrient: 'Fiber', amount: 28, unit: 'g' },
  { nutrient: 'Sugar', amount: 50, unit: 'g' },
  { nutrient: 'Sodium', amount: 2300, unit: 'mg' },
  { nutrient: 'Vitamin C', amount: 90, unit: 'mg' },
  { nutrient: 'Calcium', amount: 1300, unit: 'mg' },
  { nutrient: 'Iron', amount: 18, unit: 'mg' },
  { nutrient: 'Potassium', amount: 4700, unit: 'mg' },
];
