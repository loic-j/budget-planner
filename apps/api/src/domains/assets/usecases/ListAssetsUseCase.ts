import { injectable, inject } from 'tsyringe';
import type { Asset } from '../entities/Asset.js';
import type { IAssetRepository } from '../repositories/IAssetRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListAssetsUseCase {
  constructor(
    @inject('IAssetRepository') private assetRepo: IAssetRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string): Promise<Asset[]> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    return this.assetRepo.findByBudget(budgetId);
  }
}
