export type StepDay = {
  date: string; // YYYY-MM-DD
  count: number;
  source?: string;
};

export type StepsSummary = {
  todaySteps: number;
  last7Days: StepDay[];
};
