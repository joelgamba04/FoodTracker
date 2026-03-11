// src/services/foodSearchService.ts
import { api } from "@/lib/apiClient";
import type {
  FoodSearchResult,
  ViewFoodDetailResponse,
} from "@/models/foodModels"; // adjust if your path differs

/**
 * These route paths are assumptions based on names:
 *  - GET /food/view/:foodId
 *  - GET /food/search?query=...
 *  - GET /food/search-by-category?categoryId=...
 */
const ROUTES = {
  viewFood: (foodId: number) => `/food/view/${foodId}`,
  searchByName: (query: string) =>
    `/food/search?query=${encodeURIComponent(query)}`,
  searchByCategory: (categoryId: number) =>
    `/food/categoryId${encodeURIComponent(String(categoryId))}`,
};

/**
 * View full details for a single food item.
 */
export const ViewFoodDetail = async (
  foodId: number,
): Promise<ViewFoodDetailResponse> => {
  if (!Number.isFinite(foodId) || foodId <= 0) {
    throw new Error("Invalid foodId");
  }

  return await api<ViewFoodDetailResponse>(ROUTES.viewFood(foodId), {
    method: "GET",
    auth: false,
  });
};

/**
 * Search foods by NAME (Filipino/English).
 */
export const searchFoods = async (query: string): Promise<FoodSearchResult> => {
  const q = (query ?? "").trim();
  if (!q) {
    // Return an empty result shape that matches your API response type
    return { success: true, data: [], count: 0, message: "Empty query" };
  }

  return await api<FoodSearchResult>(ROUTES.searchByName(q), {
    method: "GET",
    auth: false,
  });
};

/**
 * Search foods by CATEGORY.
 */
export const SearchFoodsByCategory = async (
  categoryId: number,
): Promise<FoodSearchResult> => {
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    throw new Error("Invalid categoryId");
  }

  return await api<FoodSearchResult>(ROUTES.searchByCategory(categoryId), {
    method: "GET",
    auth: false,
  });
};
