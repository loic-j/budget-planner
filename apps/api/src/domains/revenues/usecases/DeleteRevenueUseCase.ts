import { injectable, inject } from 'tsyringe';
import type { IRevenueRepository } from '../repositories/IRevenueRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class DeleteRevenueUseCase {
  constructor(
    @inject('IRevenueRepository') private revenueRepo: IRevenueRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, revenueId: string): Promise<void> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage revenues');
    const existing = await this.revenueRepo.findById(revenueId);
    if (!existing || existing.budgetId !== budgetId)
      throw new NotFoundError(`Revenue ${revenueId} not found`);
    await this.revenueRepo.delete(revenueId);
  }
}
