import { FoodLogEntry } from "@/models/models";
import { Platform } from "react-native";

const LOG_STORAGE_KEY = "@FoodLogToday";

// Define the core storage mechanism based on environment
let storageImpl: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

// --- PLATFORM-SPECIFIC PERSISTENCE IMPLEMENTATION ---
if (Platform.OS === "web") {
  // --- Web Environment: Use localStorage ---
  console.log("Persistence: Using localStorage (Web).");
  storageImpl = {
    // Wrap synchronous localStorage call in a Promise to simulate async storage
    getItem: (key: string) =>
      new Promise((resolve) => resolve(localStorage.getItem(key))),
    // Wrap synchronous localStorage call in a Promise to simulate async storage
    setItem: (key: string, value: string) =>
      new Promise((resolve) => {
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          console.error("localStorage setItem failed:", e);
        }
        resolve();
      }),
  };
} else {
  // --- Native/Mobile Environment: AsyncStorage Placeholder ---

  // NOTE: In a real native app, you MUST import and use the actual AsyncStorage
  // library (e.g., from '@react-native-async-storage/async-storage') here.
  // The code below is a placeholder to prevent crashes in a pure RN environment.
  console.warn(
    `Persistence: Using AsyncStorage mock for ${Platform.OS}. Please implement real AsyncStorage.`
  );

  storageImpl = {
    getItem: async () => {
      console.log("MOCK: getItem called.");
      return Promise.resolve(null);
    },
    setItem: async () => {
      console.log("MOCK: setItem called.");
      return Promise.resolve();
    },
  };
}

const LocalStore = {
  getItem: storageImpl.getItem,
  setItem: storageImpl.setItem,
};

/**
 * Saves the food log data via the unified persistence layer.
 */
export const saveFoodLog = async (log: FoodLogEntry[]): Promise<void> => {
  try {
    // Stringify the log, converting Date objects to ISO strings
    const dataToSave = JSON.stringify(log);
    await LocalStore.setItem(LOG_STORAGE_KEY, dataToSave);
  } catch (e) {
    console.error("Error saving food log locally:", e);
  }
};

/**
 * Loads the food log data from the unified persistence layer.
 */
export const loadFoodLog = async (): Promise<FoodLogEntry[] | null> => {
  try {
    const storedData = await LocalStore.getItem(LOG_STORAGE_KEY);
    if (storedData) {
      // Parse the JSON and convert timestamp strings back to Date objects
      const parsedData: FoodLogEntry[] = JSON.parse(storedData);
      return parsedData.map((entry) => ({
        ...entry,
        // Ensure timestamp is a Date object
        timestamp: new Date(entry.timestamp),
      }));
    }
    return null;
  } catch (e) {
    console.error("Error loading food log locally:", e);
    return null;
  }
};
