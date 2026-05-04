import { injectable, inject } from 'tsyringe';
import type { Asset } from '../entities/Asset.js';
import type { IAssetRepository, UpdateAssetData } from '../repositories/IAssetRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class UpdateAssetUseCase {
  constructor(
    @inject('IAssetRepository') private assetRepo: IAssetRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(
    budgetId: string,
    userId: string,
    assetId: string,
    data: UpdateAssetData
  ): Promise<Asset> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage assets');
    const existing = await this.assetRepo.findById(assetId);
    if (!existing || existing.budgetId !== budgetId)
      throw new NotFoundError(`Asset ${assetId} not found`);
    return this.assetRepo.update(assetId, data);
  }
}
