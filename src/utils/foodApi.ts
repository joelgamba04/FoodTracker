// Placeholder for custom food API integration
import { Food } from "@/models/models";

const MOCK_FOODS: Food[] = [
  {
    id: "1",
    name: "White Rice (protein-reduced)",
    servingSize: "1/3 cup (55g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "2",
    name: "Ampaw (Pinipig)",
    servingSize: "2 pcs (25g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "3",
    name: "Biko",
    servingSize: "1 slice (40g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "4",
    name: "Cuchinta",
    servingSize: "2 pcs (60g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "5",
    name: "Sapin-sapin",
    servingSize: "1 slice (55g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "6",
    name: "Cornstarch",
    servingSize: "1/4 cup (25g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "7",
    name: "Maja Blanca",
    servingSize: "1/2 slice (65g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "8",
    name: "Maja mais",
    servingSize: "1 slice (75g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "9",
    name: "Bihon",
    servingSize: "1 cup (100g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "10",
    name: "Misua",
    servingSize: "1 cup (100g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "11",
    name: "Sotanghon",
    servingSize: "1 cup (100g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "12",
    name: "Sweet potato noodles",
    servingSize: "1 cup (100g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "13",
    name: "Gabi",
    servingSize: "3/4 cup (100g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "14",
    name: "Kamote (dilaw, murado, puti)",
    servingSize: "3/4 cup (85g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "15",
    name: "Kamoteng kahoy / balinghoy",
    servingSize: "3/4 cup (85g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "16",
    name: "Kamoteng kahoy / bibingka",
    servingSize: "1 slice (55g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "17",
    name: "Kamoteng kahoy / linupak",
    servingSize: "1 pc (55g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "18",
    name: "Kamoteng kahoy / pichi-pichi",
    servingSize: "1 pc (45g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "19",
    name: "Kamoteng kahoy / suman",
    servingSize: "1 pc (45g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "20",
    name: "Tugi",
    servingSize: "1 1/4 cup (150g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "21",
    name: "Ube (purple yam)",
    servingSize: "1 1/4 cup (150g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "22",
    name: "Saging saba, nilaga",
    servingSize: "1 pc (65g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "23",
    name: "Sago nilaga",
    servingSize: "1/2 cup (120g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "24",
    name: "Sago tapioca",
    servingSize: "3/4 cup (160g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 0 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "25",
    name: "White Rice (well-milled)",
    servingSize: "1/2 cup (80g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "26",
    name: "Red Rice (undermilled red)",
    servingSize: "1/2 cup (80g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "27",
    name: "Pinawa Rice (brown rice)",
    servingSize: "1/2 cup (80g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "28",
    name: "Lugaw (Thin consistency)",
    servingSize: "4 1/2 cup (705g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "29",
    name: "Lugaw (Medium consistency)",
    servingSize: "3 cup (435g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "30",
    name: "Lugaw (Thick consistency)",
    servingSize: "1 1/2 cup (250g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "31",
    name: "Ampaw rice",
    servingSize: "2 pcs (25g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "32",
    name: "Bibingka, galapong",
    servingSize: "1/2 slice (45g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "33",
    name: "Bibingka, malagkit",
    servingSize: "1/2 slice (40g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "34",
    name: "Bibingka, pinipig",
    servingSize: "1 slice (50g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "35",
    name: "Espasol",
    servingSize: "1 slice (35g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "36",
    name: "Kalamay, may latik",
    servingSize: "1 slice (50g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "37",
    name: "Kalamay, ube",
    servingSize: "1 slice (60g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "38",
    name: "Palitaw, walang niyog",
    servingSize: "3 pcs (50g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "39",
    name: "Puto, brown",
    servingSize: "1/2 slice (50g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "40",
    name: "Puto bumbong",
    servingSize: "2 pcs (40g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "41",
    name: "Puto maya",
    servingSize: "1/2 slice (60g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "42",
    name: "Puto, puti",
    servingSize: "3 pcs (50g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "43",
    name: "Puto seko",
    servingSize: "4 pcs (25g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
    ],
  },
  {
    id: "44",
    name: "Puto seko, may niyog",
    servingSize: "7 pcs (25g)",
    nutrients: [
      { name: "Calories", unit: "kcal", amount: 95 },
      { name: "Carbohydrate", unit: "g", amount: 23 },
      { name: "Protein", unit: "g", amount: 2 },
      { name: "Fat", unit: "g", amount: 0 },
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
