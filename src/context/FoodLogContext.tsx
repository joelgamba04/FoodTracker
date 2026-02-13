import { FoodLogEntry } from "@/models/models";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { initDb } from "@/shared/storage/db";
import {
  clearAllFoodLogs,
  deleteFoodLog,
  insertFoodLog,
  listAllFoodLogs,
  patchFoodLog,
  updateFoodLogQuantity,
} from "@/shared/storage/foodRepo";

interface FoodLogContextType {
  log: FoodLogEntry[];
  addEntry: (entry: FoodLogEntry) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  updateEntry: (entryId: string, newQuantity: number) => Promise<void>;
  patchEntry: (
    localId: string,
    partial: Partial<FoodLogEntry>,
  ) => Promise<void>;
  clearAll: () => Promise<void>;
  isLoading: boolean;
}

const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

// --- Provider Component ---
export const FoodLogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [log, setLog] = useState<FoodLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        const rows = await listAllFoodLogs();
        setLog(rows);
      } catch (e) {
        console.error("Failed to init/load food logs from SQLite:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const addEntry = useCallback(async (entry: FoodLogEntry) => {
    setLog((prev) => [entry, ...prev]);
    try {
      await insertFoodLog(entry);
    } catch (e) {
      console.error("SQLite addEntryFoodLog failed:", e);
    }
  }, []);

  const removeEntry = useCallback(async (entryId: string) => {
    setLog((prev) => prev.filter((e) => e.localId !== entryId));
    try {
      await deleteFoodLog(entryId);
    } catch (e) {
      console.error("SQLite removeEntryFoodLog failed:", e);
    }
  }, []);

  const updateEntry = useCallback(
    async (entryId: string, newQuantity: number) => {
      if (newQuantity <= 0) return removeEntry(entryId);

      setLog((prev) =>
        prev.map((e) =>
          e.localId === entryId ? { ...e, quantity: newQuantity } : e,
        ),
      );

      try {
        await updateFoodLogQuantity(entryId, newQuantity);
      } catch (e) {
        console.error("SQLite updateEntryFoodLogQuantity failed:", e);
      }
    },
    [removeEntry],
  );

  const patchEntry = useCallback(
    async (localId: string, partial: Partial<FoodLogEntry>) => {
      setLog((prev) =>
        prev.map((e) => (e.localId === localId ? { ...e, ...partial } : e)),
      );

      try {
        await patchFoodLog(localId, partial);
      } catch (e) {
        console.error("SQLite patchEntryFoodLog failed:", e);
      }
    },
    [],
  );

  const clearAll = useCallback(async () => {
    setLog([]);
    try {
      await clearAllFoodLogs();
    } catch (e) {
      console.error("SQLite clearAllFoodLogs failed:", e);
    }
  }, []);

  return (
    <FoodLogContext.Provider
      value={{
        log,
        addEntry,
        removeEntry,
        updateEntry,
        patchEntry,
        clearAll,
        isLoading,
      }}
    >
      {children}
    </FoodLogContext.Provider>
  );
};

// --- Hook for Consumers ---
export const useFoodLog = () => {
  const context = useContext(FoodLogContext);
  if (!context)
    throw new Error("useFoodLog must be used within a FoodLogProvider");
  return context;
};
