import { injectable, inject } from 'tsyringe';
import type { Budget } from '../entities/Budget.js';
import type { IBudgetRepository } from '../repositories/IBudgetRepository.js';

@injectable()
export class ListUserBudgetsUseCase {
  constructor(@inject('IBudgetRepository') private repo: IBudgetRepository) {}

  async execute(userId: string): Promise<Budget[]> {
    return this.repo.findByMember(userId);
  }
}
