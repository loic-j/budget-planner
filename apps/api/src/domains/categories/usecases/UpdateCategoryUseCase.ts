import { injectable, inject } from 'tsyringe';
import type { Category } from '../entities/Category.js';
import type {
  ICategoryRepository,
  UpdateCategoryData,
} from '../repositories/ICategoryRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class UpdateCategoryUseCase {
  constructor(
    @inject('ICategoryRepository') private categoryRepo: ICategoryRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(
    budgetId: string,
    categoryId: string,
    userId: string,
    data: UpdateCategoryData
  ): Promise<Category> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenError('Only OWNER or EDITOR can manage categories');
    }

    const category = await this.categoryRepo.findById(categoryId);
    if (!category || category.budgetId !== budgetId) {
      throw new NotFoundError(`Category ${categoryId} not found`);
    }

    return this.categoryRepo.update(categoryId, data);
  }
}
