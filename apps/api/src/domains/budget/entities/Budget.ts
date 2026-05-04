export class Budget {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ownerId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly currency: string,
    public readonly initialSaving: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly description?: string
  ) {}
}

export type BudgetRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface BudgetMembership {
  budgetId: string;
  userId: string;
  role: BudgetRole;
}
