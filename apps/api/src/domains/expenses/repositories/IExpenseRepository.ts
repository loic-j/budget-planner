import type { Expense, Frequency } from '../entities/Expense.js';

export interface CreateRegularExpenseData {
  type: 'REGULAR';
  name: string;
  categoryId?: string;
  personId?: string;
  amount: number;
  frequency: Frequency;
  frequencyValue?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateLoanExpenseData {
  type: 'LOAN';
  name: string;
  personId?: string;
  amount: number;
  frequency: 'MONTHLY';
  startDate?: Date;
  endDate?: Date;
}

export type CreateExpenseData = CreateRegularExpenseData | CreateLoanExpenseData;

export interface UpdateRegularExpenseData {
  name?: string;
  categoryId?: string | null;
  personId?: string | null;
  amount?: number;
  frequency?: Frequency;
  frequencyValue?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface UpdateLoanExpenseData {
  name?: string;
  personId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface IExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findByBudget(budgetId: string): Promise<Expense[]>;
  create(budgetId: string, data: CreateExpenseData): Promise<Expense>;
  updateRegular(id: string, data: UpdateRegularExpenseData): Promise<Expense>;
  updateLoan(id: string, data: UpdateLoanExpenseData): Promise<Expense>;
  delete(id: string): Promise<void>;
}
