import { injectable, inject } from 'tsyringe';
import type { Category } from '../entities/Category.js';
import type {
  ICategoryRepository,
  CreateCategoryData,
} from '../repositories/ICategoryRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class CreateCategoryUseCase {
  constructor(
    @inject('ICategoryRepository') private categoryRepo: ICategoryRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, data: CreateCategoryData): Promise<Category> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenError('Only OWNER or EDITOR can manage categories');
    }
    return this.categoryRepo.create(budgetId, { ...data, isPreset: false });
  }
}
