import { injectable, inject } from 'tsyringe';
import type { Budget } from '../entities/Budget.js';
import type { IBudgetRepository } from '../repositories/IBudgetRepository.js';
import { NotFoundError, ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class GetBudgetUseCase {
  constructor(@inject('IBudgetRepository') private repo: IBudgetRepository) {}

  async execute(budgetId: string, userId: string): Promise<Budget> {
    const budget = await this.repo.findById(budgetId);
    if (!budget) throw new NotFoundError(`Budget ${budgetId} not found`);

    const member = await this.repo.findMember(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');

    return budget;
  }
}
