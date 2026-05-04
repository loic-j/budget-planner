import type { BudgetRole } from './Budget.js';

export class BudgetMember {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly userId: string,
    public readonly role: BudgetRole,
    public readonly joinedAt: Date,
    public readonly userEmail: string,
    public readonly userName: string | null
  ) {}
}
