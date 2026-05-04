import type { Saving, Frequency } from '../entities/Saving.js';

export interface CreateSavingData {
  name: string;
  categoryId?: string;
  personId?: string;
  amount: number;
  frequency: Frequency;
  frequencyValue?: number;
  startDate?: Date;
  endDate?: Date;
  targetAmount?: number;
}

export interface UpdateSavingData {
  name?: string;
  categoryId?: string | null;
  personId?: string | null;
  amount?: number;
  frequency?: Frequency;
  frequencyValue?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  targetAmount?: number | null;
}

export interface ISavingRepository {
  findById(id: string): Promise<Saving | null>;
  findByBudget(budgetId: string, personId?: string): Promise<Saving[]>;
  create(budgetId: string, data: CreateSavingData): Promise<Saving>;
  update(id: string, data: UpdateSavingData): Promise<Saving>;
  delete(id: string): Promise<void>;
}
