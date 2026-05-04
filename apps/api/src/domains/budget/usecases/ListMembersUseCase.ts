import { injectable, inject } from 'tsyringe';
import type { BudgetMember } from '../entities/BudgetMember.js';
import type { IBudgetMemberRepository } from '../repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListMembersUseCase {
  constructor(@inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository) {}

  async execute(budgetId: string, userId: string): Promise<BudgetMember[]> {
    const requester = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!requester) throw new ForbiddenError('Not a member of this budget');

    return this.memberRepo.findByBudget(budgetId);
  }
}
