// src/models/waterModels.ts

import { SyncStatus } from "./models";

export interface WaterEntry {
  id: string; // local ID (UUID)
  timestamp: number; // Unix timestamp in milliseconds
  amount_ml: number; // amount of water in milliliters
  syncStatus: SyncStatus; // 'pending', 'synced', or 'failed'
  lastSyncError?: string | null; // error message if sync failed
}
