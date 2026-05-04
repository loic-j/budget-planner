import { injectable, inject } from 'tsyringe';
import type { Saving } from '../entities/Saving.js';
import type { ISavingRepository, CreateSavingData } from '../repositories/ISavingRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class CreateSavingUseCase {
  constructor(
    @inject('ISavingRepository') private savingRepo: ISavingRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, data: CreateSavingData): Promise<Saving> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage savings');
    return this.savingRepo.create(budgetId, data);
  }
}
