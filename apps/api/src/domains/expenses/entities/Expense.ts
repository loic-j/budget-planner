export type ExpenseType = 'REGULAR' | 'LOAN';
export type Frequency = 'ONE_TIME' | 'MONTHLY' | 'YEARLY' | 'EVERY_X_MONTHS' | 'EVERY_X_YEARS';

export class Expense {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly type: ExpenseType,
    public readonly name: string,
    public readonly amount: number,
    public readonly frequency: Frequency,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly categoryId: string | null = null,
    public readonly personId: string | null = null,
    public readonly frequencyValue: number | null = null,
    public readonly startDate: Date | null = null,
    public readonly endDate: Date | null = null,
    public readonly loanDetail: import('./LoanDetail.js').LoanDetail | null = null
  ) {}
}
