import { WaterEntry } from "@/models/waterModels";
import { initDb } from "@/shared/storage/db";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    clearAllWaterEntries,
    deleteWaterEntry,
    getAllWaterEntries,
    insertWaterEntry,
} from "@/shared/storage/waterRepo";

interface hydrationContextType {
  entries: WaterEntry[];
  isLoading: boolean;

  addMl: (ml: number) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  getTodayTotalMl: (startMs: number, endMs: number) => number;
}

const hydrationContext = createContext<hydrationContextType | undefined>(
  undefined,
);

const makeId = () => {
  // simple local id
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const HydrationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        const rows = await getAllWaterEntries();
        setEntries(rows);
      } catch (e) {
        console.error("Failed to init/load water entries:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const addMl = useCallback(async (ml: number) => {
    if (!Number.isFinite(ml) || ml <= 0) return;

    const entry: WaterEntry = {
      id: makeId(),
      timestamp: Date.now(),
      amount_ml: Math.round(ml),
      syncStatus: "pending",
      lastSyncError: null,
    };

    setEntries((prev) => [entry, ...prev]);

    try {
      await insertWaterEntry(entry);
    } catch (e) {
      console.error("SQLite insertWaterEntry failed:", e);
    }
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));

    try {
      await deleteWaterEntry(id);
    } catch (e) {
      console.error("SQLite deleteWaterEntry failed:", e);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setEntries([]);
    try {
      await clearAllWaterEntries();
    } catch (e) {
      console.error("SQLite clearAllWaterEntries failed:", e);
    }
  }, []);

  const getTodayTotalMl = useCallback(
    (startMs: number, endMs: number) => {
      let total = 0;
      for (const e of entries) {
        if (e.timestamp >= startMs && e.timestamp < endMs) total += e.amount_ml;
      }
      return total;
    },
    [entries],
  );

  return (
    <hydrationContext.Provider
      value={{
        entries,
        isLoading,
        addMl,
        removeEntry,
        clearAll,
        getTodayTotalMl,
      }}
    >
      {children}
    </hydrationContext.Provider>
  );
};

export const useHydration = () => {
  const ctx = useContext(hydrationContext);
  if (!ctx)
    throw new Error("useHydration must be used within a HydrationProvider");
  return ctx;
};
