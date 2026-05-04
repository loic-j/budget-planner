import { injectable, inject } from 'tsyringe';
import type { Budget } from '../entities/Budget.js';
import type { IBudgetRepository, CreateBudgetData } from '../repositories/IBudgetRepository.js';
import { SeedPresetCategoriesUseCase } from '../../categories/usecases/SeedPresetCategoriesUseCase.js';

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
  constructor(
    @inject('IBudgetRepository') private repo: IBudgetRepository,
    @inject(SeedPresetCategoriesUseCase) private seedCategories: SeedPresetCategoriesUseCase
  ) {}

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

    const budget = await this.repo.create(data);
    await this.seedCategories.execute(budget.id);
    return budget;
  }
}
