import { FoodLogEntry } from "@/models/models";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface FoodLogContextType {
  log: FoodLogEntry[];
  addEntry: (entry: FoodLogEntry) => void;
  clearLog: () => void;
}

const FoodLogContext = createContext<FoodLogContextType | undefined>(undefined);

export function FoodLogProvider({ children }: { children: ReactNode }) {
  const [log, setLog] = useState<FoodLogEntry[]>([]);

  const addEntry = (entry: FoodLogEntry) => setLog((prev) => [...prev, entry]);
  const clearLog = () => setLog([]);

  return (
    <FoodLogContext.Provider value={{ log, addEntry, clearLog }}>
      {children}
    </FoodLogContext.Provider>
  );
}

export const useFoodLog = () => {
  const context = useContext(FoodLogContext);
  if (context === undefined) {
    throw new Error("useFoodLog must be used within a FoodLogProvider");
  }
  return context;
};
