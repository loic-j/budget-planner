import { injectable, inject } from 'tsyringe';
import type { Saving } from '../entities/Saving.js';
import type { ISavingRepository } from '../repositories/ISavingRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListSavingsUseCase {
  constructor(
    @inject('ISavingRepository') private savingRepo: ISavingRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, personId?: string): Promise<Saving[]> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    return this.savingRepo.findByBudget(budgetId, personId);
  }
}
