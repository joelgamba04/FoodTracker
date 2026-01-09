
export interface FoodMeasure {
    measure_id: number;
    measure_label: string;
    weight_g: string;
    dimension_ep?: string;
    is_default: number;
}

export interface FoodDetail {
    food_id: number;
    filipino_name: string;
    english_name: string;
    category_id?: number;
    category_name: string;
    carbohydrate_g: string;
    protein_g: string;
    fat_g: string;
    energy_kcal: number;
    measures: FoodMeasure[];
}

export interface FoodSearchResult {
    success: boolean;
    message?: string;
    data: FoodDetail[];
    count: number;
}

export interface ViewFoodDetailResponse {
    success: boolean;
    message?: string;
    data: FoodDetail;
}

export interface SearchCategoriesResponse {
    success: boolean;
    message?: string;
    data: FoodDetail[];
}

