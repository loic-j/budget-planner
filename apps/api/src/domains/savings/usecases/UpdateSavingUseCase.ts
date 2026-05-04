import { injectable, inject } from 'tsyringe';
import type { Saving } from '../entities/Saving.js';
import type { ISavingRepository, UpdateSavingData } from '../repositories/ISavingRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class UpdateSavingUseCase {
  constructor(
    @inject('ISavingRepository') private savingRepo: ISavingRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(
    budgetId: string,
    userId: string,
    savingId: string,
    data: UpdateSavingData
  ): Promise<Saving> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage savings');
    const existing = await this.savingRepo.findById(savingId);
    if (!existing || existing.budgetId !== budgetId)
      throw new NotFoundError(`Saving ${savingId} not found`);
    return this.savingRepo.update(savingId, data);
  }
}
