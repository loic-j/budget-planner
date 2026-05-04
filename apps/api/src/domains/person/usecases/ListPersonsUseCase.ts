import { injectable, inject } from 'tsyringe';
import type { Person } from '../entities/Person.js';
import type { IPersonRepository } from '../repositories/IPersonRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class ListPersonsUseCase {
  constructor(
    @inject('IPersonRepository') private personRepo: IPersonRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string): Promise<Person[]> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member) throw new ForbiddenError('Not a member of this budget');
    return this.personRepo.findByBudget(budgetId);
  }
}
