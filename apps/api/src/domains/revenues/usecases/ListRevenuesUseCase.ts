import { injectable, inject } from 'tsyringe';
import type { Revenue } from '../entities/Revenue.js';
import type { IRevenueRepository } from '../repositories/IRevenueRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListRevenuesUseCase {
  constructor(
    @inject('IRevenueRepository') private revenueRepo: IRevenueRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, personId?: string): Promise<Revenue[]> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    return this.revenueRepo.findByBudget(budgetId, personId);
  }
}
