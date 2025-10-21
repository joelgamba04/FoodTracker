import { FoodLogEntry } from "@/models/models";
// NOTE: Replace 'react-native-sqlite-storage' with your chosen library
import SQLite from "react-native-sqlite-storage";

// --- Database Configuration ---
const dbName = "foodlog.db";
const tableName = "log_entries";
let DB: SQLite.SQLiteDatabase | null = null;

// Helper to open the database connection
const getDB = (): Promise<SQLite.SQLiteDatabase> => {
  return new Promise((resolve, reject) => {
    if (DB) {
      resolve(DB);
      return;
    }

    SQLite.openDatabase(
      { name: dbName, location: "default" },
      (db) => {
        DB = db;
        console.log("Database opened successfully");
        resolve(db);
      },
      (error) => {
        console.error("Error opening database: ", error);
        reject(error);
      }
    );
  });
};

// --- Initialization ---
export const initDB = async () => {
  const db = await getDB();
  const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            food_json TEXT NOT NULL, 
            quantity REAL NOT NULL,
            timestamp INTEGER NOT NULL
        );
    `;
  db.transaction((tx) => {
    tx.executeSql(
      query,
      [],
      () => console.log("Table created successfully"),
      (tx, error) => {
        console.error("Error creating table: ", error);
        return false;
      }
    );
  });
};

// --- CRUD Operations ---

// CREATE
export const addLogEntry = async (entry: FoodLogEntry) => {
  const db = await getDB();
  const foodJson = JSON.stringify(entry.food);
  const timestamp = entry.timestamp.getTime(); // Store date as a numeric timestamp

  const query = `INSERT INTO ${tableName} (food_json, quantity, timestamp) VALUES (?, ?, ?);`;

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        [foodJson, entry.quantity, timestamp],
        (tx, results) => resolve(results.insertId),
        (tx, error) => {
          console.error("Error inserting entry: ", error);
          reject(error);
          return true;
        }
      );
    });
  });
};

// READ (Get all logs for a specific day)
export const getLogsByDay = async (date: Date): Promise<FoodLogEntry[]> => {
  const db = await getDB();

  // Calculate the start and end timestamps for the given day
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);

  const query = `SELECT * FROM ${tableName} WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC;`;

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        [startOfDay, endOfDay],
        (tx, results) => {
          const entries: FoodLogEntry[] = [];
          for (let i = 0; i < results.rows.length; i++) {
            const row = results.rows.item(i);
            entries.push({
              food: JSON.parse(row.food_json),
              quantity: row.quantity,
              timestamp: new Date(row.timestamp),
            });
          }
          resolve(entries);
        },
        (tx, error) => {
          console.error("Error fetching logs: ", error);
          reject(error);
          return true;
        }
      );
    });
  });
};
