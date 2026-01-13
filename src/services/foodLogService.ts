// src/services/foodLogService.ts

import { api } from "@/lib/apiClient";
import {
  AddFoodLogEntryBody,
  AddFoodLogEntryResponse,
  UpdateFoodLogEntryBody,
} from "@/models/foodLogModels";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const ROUTES = {
  addEntry: () => "/meal/meal-logs",
  updateEntry: (id: number) =>
    `/meal/meal-log/${encodeURIComponent(String(id))}`,
  deleteEntry: (id: number) =>
    `/meal/meal-log/${encodeURIComponent(String(id))}`,
};


export const AddFoodLogEntry = async (foodLogEntryBody: AddFoodLogEntryBody) => {
  const res = await api<ApiResponse<AddFoodLogEntryResponse>>(
    ROUTES.addEntry(),
    {
      method: "POST",
      body: JSON.stringify({
        ...foodLogEntryBody,
        notes: foodLogEntryBody.notes ?? "", // ensure string
      }),
    }
  );

  if (!res.success) {
    throw new Error(res.message || "Failed to add food log entry");
  }

  return res;
};

export const UpdateFoodLog = async (
  id: number,
  updateFoodLogEntryBody: UpdateFoodLogEntryBody
) => {

  const res = await api<ApiResponse<unknown>>(ROUTES.updateEntry(id), {
    method: "PUT",
    body: JSON.stringify(updateFoodLogEntryBody),
  });
    if (!res.success) { 
        throw new Error(res.message || "Failed to update food log entry");
    }
    return res;
};

export const DeleteFoodLogEntry = async (id: number) => {

    const res = await api<ApiResponse<unknown>>(ROUTES.deleteEntry(id), {
      method: "DELETE",
    });
    
    if (!res.success) {
        throw new Error(res.message || "Failed to delete food log entry");
    }
    return res;
}