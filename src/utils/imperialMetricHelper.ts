export const cmToFtIn = (cm: number) => {
  const inchesTotal = cm / 2.54;
  const ft = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal - ft * 12);
  return { ft, inches };
};

export const ftInToCm = (ft: number, inches: number) => {
  const totalInches = ft * 12 + inches;
  return totalInches * 2.54;
};

export const kgToLb = (kg: number) => kg * 2.2046226218;
export const lbToKg = (lb: number) => lb / 2.2046226218;