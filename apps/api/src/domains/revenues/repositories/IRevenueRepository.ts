import type { Revenue, Frequency } from '../entities/Revenue.js';

export interface CreateRevenueData {
  name: string;
  categoryId?: string;
  personId?: string;
  amount: number;
  frequency: Frequency;
  frequencyValue?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateRevenueData {
  name?: string;
  categoryId?: string | null;
  personId?: string | null;
  amount?: number;
  frequency?: Frequency;
  frequencyValue?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface IRevenueRepository {
  findById(id: string): Promise<Revenue | null>;
  findByBudget(budgetId: string, personId?: string): Promise<Revenue[]>;
  create(budgetId: string, data: CreateRevenueData): Promise<Revenue>;
  update(id: string, data: UpdateRevenueData): Promise<Revenue>;
  delete(id: string): Promise<void>;
}
