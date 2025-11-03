// Placeholder for custom food API integration
import { Food } from '@/models/models';

const MOCK_FOODS: Food[] = [
  {
    id: "1",
    name: "Apple",
    servingSize: "1 medium",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 25 },
      { name: "Fiber", unit: "g", amount: 4.4 },
      { name: "Vitamin C", unit: "mg", amount: 8.4 },
    ],
  },
  {
    id: "2",
    name: "Egg",
    servingSize: "1 large",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 78 },
      { name: "Protein", unit: "g", amount: 6 },
      { name: "Fat", unit: "g", amount: 5 },
    ],
  },
  {
    id: "3",
    name: "Coffee (Black)",
    servingSize: "1 cup",
    nutrients: [
      { name: "Calories", amount: 2, unit: "kcal" },
      { name: "Protein", amount: 0.3, unit: "g" },
    ],
  },
  {
    id: "4",
    name: "Scrambled Eggs",
    servingSize: "2 large",
    nutrients: [
      { name: "Calories", amount: 180, unit: "kcal" },
      { name: "Protein", amount: 12, unit: "g" },
      { name: "Fat", amount: 14, unit: "g" },
      { name: "Carbohydrate", amount: 2, unit: "g" },
    ],
  },
  {
    id: "5",
    name: "Oats",
    servingSize: "1/2 cup dry",
    nutrients: [
      { name: "Calories", amount: 150, unit: "kcal" },
      { name: "Carbohydrate", amount: 27, unit: "g" },
      { name: "Fiber", amount: 4, unit: "g" },
      { name: "Protein", amount: 5, unit: "g" },
    ],
  },
  {
    id: "6",
    name: "Chicken Breast",
    servingSize: "4 oz",
    nutrients: [
      { name: "Calories", amount: 165, unit: "kcal" },
      { name: "Protein", amount: 31, unit: "g" },
      { name: "Fat", amount: 3.6, unit: "g" },
      { name: "Carbohydrate", amount: 0, unit: "g" },
    ],
  },
  {
    id: "7",
    name: "Protein Shake",
    servingSize: "1 serving",
    nutrients: [
      { name: "Calories", amount: 150, unit: "kcal" },
      { name: "Protein", amount: 25, unit: "g" },
    ],
  },
];

// Function to get "favorites" (or just the list for Quick Log)
export async function getFavoriteFoods(): Promise<Food[]> {
  // In a real app, this would fetch a user's specific favorites.
  // For now, we return a subset or the full mock list.
  // We'll return IDs 3, 4, 5, 6, 7 (the non-basic ones) for the Quick Log.
  return MOCK_FOODS.filter((food) =>
    ["3", "4", "5", "6", "7"].includes(food.id)
  );
}

export async function searchFoods(query: string): Promise<Food[]> {
  const lowerQuery = query.toLowerCase();

  // Filter the MOCK_FOODS array based on the query
  const results = MOCK_FOODS.filter((food) =>
    food.name.toLowerCase().includes(lowerQuery)
  );

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return results;
}
