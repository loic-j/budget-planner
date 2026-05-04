import { injectable, inject } from 'tsyringe';
import type { IAssetRepository } from '../repositories/IAssetRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class DeleteAssetUseCase {
  constructor(
    @inject('IAssetRepository') private assetRepo: IAssetRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, assetId: string): Promise<void> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage assets');
    const existing = await this.assetRepo.findById(assetId);
    if (!existing || existing.budgetId !== budgetId)
      throw new NotFoundError(`Asset ${assetId} not found`);
    await this.assetRepo.delete(assetId);
  }
}
