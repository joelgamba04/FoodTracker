// src/shared/storage/db.ts

import * as SQLite from "expo-sqlite";

const DB_NAME = "foodtracker.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = () => {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
};

// Initializes the database schema if it doesn't exist. Safe to call multiple times.
export const initDb = async () => {
  const db = await getDb();

  // WAL is optional but helpful for concurrent reads/writes.
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS food_log_entries (
      local_id TEXT PRIMARY KEY NOT NULL,
      timestamp INTEGER NOT NULL,
      meal_type INTEGER NOT NULL,
      quantity REAL NOT NULL,
      food_json TEXT NOT NULL,

      sync_status TEXT NOT NULL,
      last_sync_error TEXT,
      server_meal_id INTEGER,
      server_food_entry_id INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_food_log_timestamp
      ON food_log_entries(timestamp);

    CREATE TABLE IF NOT EXISTS water_entries (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp INTEGER NOT NULL,
      amount_ml INTEGER NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      last_sync_error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_water_timestamp
      ON water_entries(timestamp);
  `);

  return db;
};
