export interface AddFoodLogEntryBody {
  food_id: number;
  measure_id: number;
  quantity: number;
  meal_type: number;
  notes?: string;
}

export interface AddFoodLogEntryResponse {
  meal: number;
  foodEntry: number;
}

export interface UpdateFoodLogEntryBody {
  quantity: number;
  measure_id: number;
}