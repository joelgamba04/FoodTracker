// Placeholder for custom food API integration
import { Food } from '@/models/models';

export async function searchFoods(query: string): Promise<Food[]> {
  // Replace with your custom API call
  // Example: fetch(`https://your-api.com/foods?search=${query}`)
  return [
    {
      id: '1',
      name: 'Apple',
      servingSize: '1 medium',
      nutrients: [
        { name: 'Calories', unit: 'kcal', amount: 95 },
        { name: 'Carbs', unit: 'g', amount: 25 },
        { name: 'Fiber', unit: 'g', amount: 4.4 },
        { name: 'Vitamin C', unit: 'mg', amount: 8.4 },
      ],
    },
    {
      id: '2',
      name: 'Egg',
      servingSize: '1 large',
      nutrients: [
        { name: 'Calories', unit: 'kcal', amount: 78 },
        { name: 'Protein', unit: 'g', amount: 6 },
        { name: 'Fat', unit: 'g', amount: 5 },
      ],
    },
  ];
}
