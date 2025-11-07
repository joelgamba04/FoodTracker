import { FoodLogEntry } from "@/models/models";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
// ✅ Import local persistence functions from the new file

import { loadJSON, saveJSON, storage } from "@/lib/storage";

const KEY = "@FoodLogToday";

// --- Context Definition ---
interface FoodLogContextType {
  log: FoodLogEntry[];
  addEntry: (entry: FoodLogEntry) => void;
  removeEntry: (entryId: string) => void;
  updateEntry: (entryId: string, newQuantity: number) => void;
  clearAll: () => void;
  isLoading: boolean;
}

const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

// --- Provider Component ---
export const FoodLogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [log, setLog] = useState<FoodLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Flag to ensure the log is only saved AFTER the initial load is complete
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // 1. Initial Load Effect: Load log from local storage on component mount
  useEffect(() => {
    const initializeLog = async () => {
      try {
        // Call the persistence utility function to fetch data
        const loadedLog = await loadJSON<FoodLogEntry[]>(KEY, (arr) =>
          arr.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
        );
        if (loadedLog) {
          setLog(loadedLog);
        }
      } catch (error) {
        console.error(
          "Failed to initialize food log from local storage:",
          error
        );
      } finally {
        // Set loading to false once the initial load is complete, regardless of success
        setIsLoading(false);
        setIsInitialLoadComplete(true);
      }
    };
    initializeLog();
  }, []);

  useEffect(() => {
    if (isInitialLoadComplete) saveJSON(KEY, log);
  }, [log, isInitialLoadComplete]);

  const addEntry = useCallback((entry: FoodLogEntry) => {
    setLog((prev) => [...prev, entry]);
  }, []);

  const removeEntry = useCallback((entryId: string) => {
    setLog((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const updateEntry = useCallback(
    (entryId: string, newQuantity: number) => {
      if (newQuantity <= 0) return removeEntry(entryId);
      setLog((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, quantity: newQuantity } : e
        )
      );
    },
    [removeEntry]
  );

  const clearAll = useCallback(() => {
    setLog([]);
    storage.removeItem(KEY);
  }, []);

  const contextValue = {
    log,
    addEntry,
    removeEntry,
    updateEntry,
    clearAll: () => setLog([]),
    isLoading,
  };

  return (
    <FoodLogContext.Provider value={contextValue}>
      {children}
    </FoodLogContext.Provider>
  );
};

// --- Hook for Consumers ---
export const useFoodLog = () => {
  const context = useContext(FoodLogContext);
  if (context === undefined) {
    throw new Error("useFoodLog must be used within a FoodLogProvider");
  }
  return context;
};
