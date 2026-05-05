export interface ProjectionPoint {
  date: Date;
  revenue: number;
  expense: number;
  savingContribution: number;
  assetValue: number;
  loanBalance: number;
  cashBalance: number;
  savingsBalance: number;
  netWorth: number;
}

export interface PersonAgePoint {
  personId: string;
  name: string;
  type: 'ADULT' | 'CHILD';
  ageByYear: Record<number, number | null>;
}
