import { injectable, inject } from 'tsyringe';
import type { IBudgetRepository } from '../repositories/IBudgetRepository.js';
import { NotFoundError, ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class DeleteBudgetUseCase {
  constructor(@inject('IBudgetRepository') private repo: IBudgetRepository) {}

  async execute(budgetId: string, userId: string): Promise<void> {
    const budget = await this.repo.findById(budgetId);
    if (!budget) throw new NotFoundError(`Budget ${budgetId} not found`);

    const member = await this.repo.findMember(budgetId, userId);
    if (!member || member.role !== 'OWNER')
      throw new ForbiddenError('Only the owner can delete a budget');

    await this.repo.delete(budgetId);
  }
}
