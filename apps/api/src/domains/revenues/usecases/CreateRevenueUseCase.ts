import { injectable, inject } from 'tsyringe';
import type { Revenue } from '../entities/Revenue.js';
import type { IRevenueRepository, CreateRevenueData } from '../repositories/IRevenueRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class CreateRevenueUseCase {
  constructor(
    @inject('IRevenueRepository') private revenueRepo: IRevenueRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, data: CreateRevenueData): Promise<Revenue> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage revenues');
    return this.revenueRepo.create(budgetId, data);
  }
}
