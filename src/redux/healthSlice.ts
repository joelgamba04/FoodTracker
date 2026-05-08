import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  steps: 0,
  heartRate: 0,
  sleepDuration: "0h",
  lastUpdated: null as string | null,
  isSynced: false,
};

export const healthSlice = createSlice({
  name: "health",
  initialState,
  reducers: {
    // Action to call after your HealthKit/HealthConnect fetch
    setHealthSummary: (state, action) => {
      state.steps = action.payload.steps;
      state.heartRate = action.payload.heartRate;
      state.sleepDuration = action.payload.sleepDuration;
      state.lastUpdated = new Date().toISOString();
      state.isSynced = true;
    },
    resetHealthData: () => initialState,
  },
});

export const { setHealthSummary, resetHealthData } = healthSlice.actions;
export default healthSlice.reducer;
