import { injectable, inject } from 'tsyringe';
import type { Category, CategoryType } from '../entities/Category.js';
import type { ICategoryRepository } from '../repositories/ICategoryRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListCategoriesUseCase {
  constructor(
    @inject('ICategoryRepository') private categoryRepo: ICategoryRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, type?: CategoryType): Promise<Category[]> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    return this.categoryRepo.findByBudget(budgetId, type);
  }
}
