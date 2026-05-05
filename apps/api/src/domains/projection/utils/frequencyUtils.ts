export interface FrequencyItem {
  frequency: string;
  frequencyValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
  amount: number;
}

/** Returns the pro-rated monthly contribution of an item for a given year/month. */
export function monthlyAmount(item: FrequencyItem, year: number, month: number): number {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const sd = item.startDate;
  const ed = item.endDate;
  if (sd && sd > monthEnd) return 0;
  if (ed && ed < monthStart) return 0;
  switch (item.frequency) {
    case 'ONE_TIME':
      return sd && sd.getFullYear() === year && sd.getMonth() === month ? item.amount : 0;
    case 'MONTHLY':
      return item.amount;
    case 'YEARLY':
      return item.amount / 12;
    case 'EVERY_X_MONTHS':
      return item.amount / (item.frequencyValue || 1);
    case 'EVERY_X_YEARS':
      return item.amount / ((item.frequencyValue || 1) * 12);
    default:
      return 0;
  }
}
