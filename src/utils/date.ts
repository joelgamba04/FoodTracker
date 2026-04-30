export const getTodayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const toYmd = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

export const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const lastNDaysStart = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const lastNDays = (n: number): Date[] => {
  const out: Date[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
};
