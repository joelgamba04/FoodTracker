// src/shared/storage/waterRepo.ts

import { WaterEntry } from "@/models/waterModels";
import { getDb } from "./db";

export const rowToWaterEntry = (row: any): WaterEntry => ({
  id: row.id,
  timestamp: row.timestamp,
  amount_ml: row.amount_ml,
  syncStatus: row.sync_status,
  lastSyncError: row.last_sync_error,
});

export const getAllWaterEntries = async (): Promise<WaterEntry[]> => {
  const db = await getDb();
  const result = db.getAllSync(
    "SELECT * FROM water_entries ORDER BY timestamp DESC",
  );
  return result.map(rowToWaterEntry);
};

export const listWaterEntriesBetween = async (
  startMs: number,
  endMs: number,
): Promise<WaterEntry[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM water_entries
     WHERE timestamp >= ? AND timestamp < ?
     ORDER BY timestamp DESC`,
    [startMs, endMs],
  );
  return rows.map(rowToWaterEntry);
};

export const insertWaterEntry = async (entry: WaterEntry) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO water_entries (id, timestamp, amount_ml, sync_status, last_sync_error)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.timestamp,
      entry.amount_ml,
      entry.syncStatus ?? "pending",
      entry.lastSyncError ?? null,
    ],
  );
};

export const deleteWaterEntry = async (id: string) => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM water_entries WHERE id = ?`, [id]);
};

export const clearAllWaterEntries = async () => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM water_entries`);
};
