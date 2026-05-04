import { injectable, inject } from 'tsyringe';
import type { IBudgetInviteRepository } from '../repositories/IBudgetInviteRepository.js';
import type { IBudgetRepository } from '../repositories/IBudgetRepository.js';
import { NotFoundError } from '../../../infrastructure/errors/DomainError.js';

export interface InvitePreview {
  budgetName: string;
  role: 'EDITOR' | 'VIEWER';
  isValid: boolean;
}

@injectable()
export class PreviewInviteUseCase {
  constructor(
    @inject('IBudgetInviteRepository') private inviteRepo: IBudgetInviteRepository,
    @inject('IBudgetRepository') private budgetRepo: IBudgetRepository
  ) {}

  async execute(token: string): Promise<InvitePreview> {
    const invite = await this.inviteRepo.findByToken(token);
    if (!invite) throw new NotFoundError('Invite not found');

    const budget = await this.budgetRepo.findById(invite.budgetId);
    if (!budget) throw new NotFoundError('Budget not found');

    return {
      budgetName: budget.name,
      role: invite.role,
      isValid: invite.isValid,
    };
  }
}
