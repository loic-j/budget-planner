import type { BudgetInvite, InviteRole } from '../entities/BudgetInvite.js';

export interface CreateInviteData {
  budgetId: string;
  token: string;
  role: InviteRole;
  createdBy: string;
  expiresAt?: Date;
  maxUses?: number;
}

export interface IBudgetInviteRepository {
  findByToken(token: string): Promise<BudgetInvite | null>;
  findByBudget(budgetId: string): Promise<BudgetInvite[]>;
  create(data: CreateInviteData): Promise<BudgetInvite>;
  incrementUseCount(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
