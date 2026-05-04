import { injectable, inject } from 'tsyringe';
import type { Budget } from '../entities/Budget.js';
import type { IBudgetRepository, CreateBudgetData } from '../repositories/IBudgetRepository.js';

export interface CreateBudgetInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  currency: string;
  initialSaving: number;
  ownerId: string;
}

@injectable()
export class CreateBudgetUseCase {
  constructor(@inject('IBudgetRepository') private repo: IBudgetRepository) {}

  async execute(input: CreateBudgetInput): Promise<Budget> {
    const data: CreateBudgetData = {
      name: input.name,
      description: input.description,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      currency: input.currency,
      initialSaving: input.initialSaving,
      ownerId: input.ownerId,
    };

    // TODO: call SeedPresetCategoriesUseCase after creating budget (Task 07)
    return this.repo.create(data);
  }
}
