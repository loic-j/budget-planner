import type { Budget, BudgetMembership } from '../entities/Budget.js';

export interface CreateBudgetData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  initialSaving: number;
  ownerId: string;
}

export interface UpdateBudgetData {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  initialSaving?: number;
}

export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findByMember(userId: string): Promise<Budget[]>;
  findMember(budgetId: string, userId: string): Promise<BudgetMembership | null>;
  create(data: CreateBudgetData): Promise<Budget>;
  update(id: string, data: UpdateBudgetData): Promise<Budget>;
  delete(id: string): Promise<void>;
}
