// src/context/StepContext.tsx
import { Pedometer } from "expo-sensors";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

interface StepContextValue {
  todaySteps: number | null;
  isAvailable: boolean | null;
  isLoading: boolean;
  refreshTodaySteps: () => Promise<void>;
}

const StepContext = createContext<StepContextValue | undefined>(undefined);

function getTodayWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

export const StepProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [todaySteps, setTodaySteps] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTodaySteps = useCallback(async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        setTodaySteps(null);
        return;
      }

      const { start, end } = getTodayWindow();
      const result = await Pedometer.getStepCountAsync(start, end);
      setTodaySteps(result.steps ?? 0);
    } catch (e) {
      console.warn("StepProvider: failed to read steps", e);
      setTodaySteps(null);
    }
  }, []);

  useEffect(() => {
    // Initial load
    (async () => {
      setIsLoading(true);
      await refreshTodaySteps();
      setIsLoading(false);
    })();

    // Optional: live updates while app is open
    let subscription: { remove: () => void } | null = null;
    (async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) return;

        subscription = Pedometer.watchStepCount((result) => {
          // result.steps = steps since subscription started
          // To avoid double-counting, we just refresh the whole day's total occasionally
          refreshTodaySteps();
        });
      } catch (e) {
        console.warn("StepProvider: watchStepCount failed", e);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [refreshTodaySteps]);

  return (
    <StepContext.Provider
      value={{
        todaySteps,
        isAvailable,
        isLoading,
        refreshTodaySteps,
      }}
    >
      {children}
    </StepContext.Provider>
  );
};

export const useSteps = () => {
  const ctx = useContext(StepContext);
  if (!ctx) throw new Error("useSteps must be used within a StepProvider");
  return ctx;
};
