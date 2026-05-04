import { injectable, inject } from 'tsyringe';
import type { Person } from '../entities/Person.js';
import type { IPersonRepository, UpdatePersonData } from '../repositories/IPersonRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class UpdatePersonUseCase {
  constructor(
    @inject('IPersonRepository') private personRepo: IPersonRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(
    budgetId: string,
    personId: string,
    userId: string,
    data: UpdatePersonData
  ): Promise<Person> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenError('Only OWNER or EDITOR can manage persons');
    }

    const person = await this.personRepo.findById(personId);
    if (!person || person.budgetId !== budgetId) {
      throw new NotFoundError(`Person ${personId} not found`);
    }

    return this.personRepo.update(personId, data);
  }
}
