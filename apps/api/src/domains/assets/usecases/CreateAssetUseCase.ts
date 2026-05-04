import { injectable, inject } from 'tsyringe';
import type { Asset } from '../entities/Asset.js';
import type { IAssetRepository, CreateAssetData } from '../repositories/IAssetRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class CreateAssetUseCase {
  constructor(
    @inject('IAssetRepository') private assetRepo: IAssetRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, data: CreateAssetData): Promise<Asset> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER')
      throw new ForbiddenError('Only OWNER or EDITOR can manage assets');
    return this.assetRepo.create(budgetId, data);
  }
}
