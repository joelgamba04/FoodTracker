// src/services/foodSearchService.ts
import { api, ApiError, isApiError } from "@/lib/apiClient";
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
    `/food/search-by-category?categoryId=${encodeURIComponent(String(categoryId))}`,
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

  try {
    const res = await api<ViewFoodDetailResponse>(ROUTES.viewFood(foodId), {
      method: "GET",
      auth: false,
      timeoutMs: 15000, // shorter timeout for single item fetch
    });
    return normalizeFoodDetail(res);
  } catch (error) {
    console.error("Error fetching food details:", {
      name: (error as any)?.name,
      message: (error as any)?.message,
      kind: isApiError(error) ? error.kind : undefined,
      status: isApiError(error) ? error.status : undefined,
      body: isApiError(error) ? error.body : undefined,
    });
    if (isApiError(error)) {
      throw error; // re-throw known API errors for caller to handle
    }

    throw new ApiError(
      "UNKNOWN",
      "An error occurred while fetching food details. Please try again.",
    );
  }
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

  try {
    const res = await api<FoodSearchResult>(ROUTES.searchByName(q), {
      method: "GET",
      auth: false,
      timeoutMs: 15000,
    });
    return normalizeSearchResult(res);
  } catch (error) {
    console.error("Error searching foods:", {
      name: (error as any)?.name,
      message: (error as any)?.message,
      kind: isApiError(error) ? error.kind : undefined,
      status: isApiError(error) ? error.status : undefined,
      body: isApiError(error) ? error.body : undefined,
    });
    if (isApiError(error)) {
      throw error; // re-throw known API errors for caller to handle
    }

    throw new ApiError(
      "UNKNOWN",
      "An error occurred while searching for food items.",
    );
  }
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

  try {
    const res = await api<FoodSearchResult>(
      ROUTES.searchByCategory(categoryId),
      {
        method: "GET",
        auth: false,
        timeoutMs: 15000,
      },
    );
    return normalizeSearchResult(res);
  } catch (error) {
    console.error("Error searching foods by category:", {
      name: (error as any)?.name,
      message: (error as any)?.message,
      kind: isApiError(error) ? error.kind : undefined,
      status: isApiError(error) ? error.status : undefined,
      body: isApiError(error) ? error.body : undefined,
    });
    if (isApiError(error)) {
      throw error; // re-throw known API errors for caller to handle
    }
    throw new ApiError(
      "UNKNOWN",
      "An error occurred while searching for food items.",
    );
  }
};

const normalizeSearchResult = (res: FoodSearchResult): FoodSearchResult => {
  const data = Array.isArray(res.data) ? res.data : [];

  const normalized = {
    success: Boolean(res.success),
    data,
    count: typeof res.count === "number" ? res.count : data.length,
    message: res.message ?? "",
  };

  if (!normalized.success) {
    throw new ApiError("UNKNOWN", normalized.message || "Search failed.", {
      body: normalized,
    });
  }

  return normalized;
};

const normalizeFoodDetail = (
  res: ViewFoodDetailResponse,
): ViewFoodDetailResponse => {
  const rawData = res.data;
  const data = Array.isArray(rawData) ? rawData[0] : rawData;

  if (!data) {
    throw new ApiError("NOT_FOUND", "Food item not found.", {
      body: res,
    });
  }

  return {
    success: Boolean(res.success),
    data,
    message: res.message ?? "",
  };
};
