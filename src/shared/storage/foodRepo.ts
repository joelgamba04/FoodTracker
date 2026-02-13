// src/shared/storage/foodRepo.ts

import { FoodLogEntry } from "@/models/models";
import { getDb } from "@/shared/storage/db";

// DB entry to food log entry mapping
function rowToEntry(row: any): FoodLogEntry {
  return {
    localId: row.local_id,
    timestamp: row.timestamp,
    mealType: row.meal_type,
    quantity: row.quantity,
    food: JSON.parse(row.food_json),
    syncStatus: row.sync_status,
    lastSyncError: row.last_sync_error ?? null,
    serverMealId: row.server_meal_id ?? null,
    serverFoodEntryId: row.server_food_entry_id ?? null,
  };
}

export async function listAllFoodLogs(): Promise<FoodLogEntry[]> {
  const db = await getDb();
  const res = await db.getAllAsync<any>(
    `SELECT * FROM food_log_entries ORDER BY timestamp DESC`,
  );
  return res.map(rowToEntry);
}

export async function listFoodLogsBetween(
  startMs: number,
  endMs: number,
): Promise<FoodLogEntry[]> {
  const db = await getDb();
  const res = await db.getAllAsync<any>(
    `SELECT * FROM food_log_entries
     WHERE timestamp >= ? AND timestamp < ?
     ORDER BY timestamp DESC`,
    [startMs, endMs],
  );
  return res.map(rowToEntry);
}

export async function insertFoodLog(entry: FoodLogEntry) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO food_log_entries
      (local_id, timestamp, meal_type, quantity, food_json, sync_status, last_sync_error, server_meal_id, server_food_entry_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.localId,
      entry.timestamp,
      entry.mealType ?? 1,
      entry.quantity,
      JSON.stringify(entry.food),
      entry.syncStatus,
      entry.lastSyncError ?? null,
      entry.serverMealId ?? null,
      entry.serverFoodEntryId ?? null,
    ],
  );
}

export async function deleteFoodLog(localId: string) {
  const db = await getDb();
  await db.runAsync(`DELETE FROM food_log_entries WHERE local_id = ?`, [
    localId,
  ]);
}

export async function updateFoodLogQuantity(localId: string, quantity: number) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE food_log_entries SET quantity = ? WHERE local_id = ?`,
    [quantity, localId],
  );
}

// Partial update function for any subset of fields
export async function patchFoodLog(
  localId: string,
  partial: Partial<FoodLogEntry>,
) {
  const db = await getDb();

  const sets: string[] = [];
  const values: any[] = [];

  if (partial.timestamp !== undefined) {
    sets.push("timestamp = ?");
    values.push(partial.timestamp);
  }
  if (partial.mealType !== undefined) {
    sets.push("meal_type = ?");
    values.push(partial.mealType);
  }
  if (partial.quantity !== undefined) {
    sets.push("quantity = ?");
    values.push(partial.quantity);
  }
  if (partial.food !== undefined) {
    sets.push("food_json = ?");
    values.push(JSON.stringify(partial.food));
  }

  if (partial.syncStatus !== undefined) {
    sets.push("sync_status = ?");
    values.push(partial.syncStatus);
  }
  if (partial.lastSyncError !== undefined) {
    sets.push("last_sync_error = ?");
    values.push(partial.lastSyncError);
  }
  if (partial.serverMealId !== undefined) {
    sets.push("server_meal_id = ?");
    values.push(partial.serverMealId);
  }
  if (partial.serverFoodEntryId !== undefined) {
    sets.push("server_food_entry_id = ?");
    values.push(partial.serverFoodEntryId);
  }

  if (sets.length === 0) return;

  values.push(localId);
  await db.runAsync(
    `UPDATE food_log_entries SET ${sets.join(", ")} WHERE local_id = ?`,
    values,
  );
}

export async function clearAllFoodLogs() {
  const db = await getDb();
  await db.runAsync(`DELETE FROM food_log_entries`);
}
