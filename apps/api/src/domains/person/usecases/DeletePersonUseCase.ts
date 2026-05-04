import { injectable, inject } from 'tsyringe';
import type { IPersonRepository } from '../repositories/IPersonRepository.js';
import type { IBudgetMemberRepository } from '../../budget/repositories/IBudgetMemberRepository.js';
import { ForbiddenError, NotFoundError } from '../../../infrastructure/errors/DomainError.js';

@injectable()
export class DeletePersonUseCase {
  constructor(
    @inject('IPersonRepository') private personRepo: IPersonRepository,
    @inject('IBudgetMemberRepository') private memberRepo: IBudgetMemberRepository
  ) {}

  async execute(budgetId: string, personId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findByBudgetAndUser(budgetId, userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenError('Only OWNER or EDITOR can manage persons');
    }

    const person = await this.personRepo.findById(personId);
    if (!person || person.budgetId !== budgetId) {
      throw new NotFoundError(`Person ${personId} not found`);
    }

    // Prisma onDelete: SetNull handles nullifying personId on linked rows
    await this.personRepo.delete(personId);
  }
}
