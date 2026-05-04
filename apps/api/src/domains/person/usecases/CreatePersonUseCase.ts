import { injectable, inject } from 'tsyringe';
import type { Person } from '../entities/Person.js';
import type { IPersonRepository, CreatePersonData } from '../repositories/IPersonRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class CreatePersonUseCase {
  constructor(
    @inject('IPersonRepository') private personRepo: IPersonRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, userId: string, data: CreatePersonData): Promise<Person> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenError('Only OWNER or EDITOR can manage persons');
    }
    return this.personRepo.create(budgetId, data);
  }
}
