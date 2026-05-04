import type { BudgetMember } from '../entities/BudgetMember.js';
import type { BudgetRole } from '../entities/Budget.js';

export interface IBudgetMemberRepository {
  findByBudget(budgetId: string): Promise<BudgetMember[]>;
  findByBudgetAndUser(budgetId: string, userId: string): Promise<BudgetMember | null>;
  create(budgetId: string, userId: string, role: BudgetRole): Promise<BudgetMember>;
  updateRole(budgetId: string, userId: string, role: BudgetRole): Promise<BudgetMember>;
  delete(budgetId: string, userId: string): Promise<void>;
}
