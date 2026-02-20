
export const formatMonthYear = (startDate: string, monthOffset: number): string => {
  const date = new Date(startDate);
  // Using setDate(1) to avoid issues with months having different number of days (e.g., Feb 30th)
  date.setDate(1);
  date.setMonth(date.getMonth() + monthOffset);
  
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  
  return `${month}-${year}`;
};

/**
 * Calculates a standard payment date for a specific month in the chit duration.
 * Defaults to the 10th of the month.
 */
export const calculatePaymentDate = (startDate: string, monthOffset: number): string => {
  const date = new Date(startDate);
  date.setDate(1);
  date.setMonth(date.getMonth() + monthOffset);
  // Common practice: set a default payment day (e.g., the 10th)
  date.setDate(10);
  return date.toISOString().split('T')[0];
};

/**
 * Determines which month index the group is currently in.
 */
export const getCurrentMonthIndex = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, months);
};
