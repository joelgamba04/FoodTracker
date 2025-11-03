import { FoodLogEntry } from "@/models/models";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
// ✅ Import local persistence functions from the new file
import { loadFoodLog, saveFoodLog } from "@/utils/persistence";

// --- Context Definition ---
interface FoodLogContextType {
  log: FoodLogEntry[];
  addEntry: (entry: FoodLogEntry) => void;
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
        const loadedLog = await loadFoodLog();
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

  // 2. Saving Effect: Save log to local storage whenever the 'log' state changes
  useEffect(() => {
    // IMPORTANT: Only save if the initial load is complete.
    // This prevents saving an empty array right after the app starts
    // but before the attempt to load old data finishes.
    if (isInitialLoadComplete) {
      // Call the persistence utility function to save data
      saveFoodLog(log);
      console.log("Food log saved locally.");
    }
  }, [log, isInitialLoadComplete]);

  // 3. Data Mutation (Adding Entry)
  const addEntry = useCallback((entry: FoodLogEntry) => {
    // Update the state optimistically. The useEffect above will detect
    // this change and trigger the asynchronous 'saveFoodLog'.
    setLog((prevLog) => [...prevLog, entry]);
  }, []);

  const contextValue = {
    log,
    addEntry,
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
