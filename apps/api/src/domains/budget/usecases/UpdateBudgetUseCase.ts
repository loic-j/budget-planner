import { injectable, inject } from 'tsyringe';
import type { Budget } from '../entities/Budget.js';
import type { IBudgetRepository, UpdateBudgetData } from '../repositories/IBudgetRepository.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../infrastructure/errors/DomainError.js';

export interface UpdateBudgetInput {
  budgetId: string;
  userId: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  initialSaving?: number;
}

@injectable()
export class UpdateBudgetUseCase {
  constructor(@inject('IBudgetRepository') private repo: IBudgetRepository) {}

  async execute(input: UpdateBudgetInput): Promise<Budget> {
    const budget = await this.repo.findById(input.budgetId);
    if (!budget) throw new NotFoundError(`Budget ${input.budgetId} not found`);

    const member = await this.repo.findMember(input.budgetId, input.userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    if (member.role === 'VIEWER') throw new ForbiddenError('Viewers cannot edit budgets');

    if (member.role === 'EDITOR') {
      if (input.name !== undefined)
        throw new ValidationError('Editors cannot change the budget name');
      if (input.currency !== undefined)
        throw new ValidationError('Editors cannot change the currency');
      if (input.startDate !== undefined)
        throw new ValidationError('Editors cannot change start date');
      if (input.endDate !== undefined) throw new ValidationError('Editors cannot change end date');
    }

    const data: UpdateBudgetData = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.initialSaving !== undefined) data.initialSaving = input.initialSaving;

    return this.repo.update(input.budgetId, data);
  }
}
