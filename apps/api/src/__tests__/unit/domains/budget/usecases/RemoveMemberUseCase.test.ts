import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { RemoveMemberUseCase } from '../../../../../domains/budget/usecases/RemoveMemberUseCase.js';
import type { IBudgetMemberRepository } from '../../../../../domains/budget/repositories/IBudgetMemberRepository.js';
import { BudgetMember } from '../../../../../domains/budget/entities/BudgetMember.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../../../infrastructure/errors/DomainError.js';

const now = new Date();
const ownerMember = new BudgetMember('m1', 'b1', 'u1', 'OWNER', now, 'owner@test.com', 'Owner');
const editorMember = new BudgetMember('m2', 'b1', 'u2', 'EDITOR', now, 'editor@test.com', 'Editor');

const mockRepo: IBudgetMemberRepository = {
  findByBudget: vi.fn(),
  findByBudgetAndUser: vi.fn(),
  create: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
};

describe('RemoveMemberUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes member when requester is OWNER', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser)
      .mockResolvedValueOnce(ownerMember)
      .mockResolvedValueOnce(editorMember);
    vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

    const useCase = new RemoveMemberUseCase(mockRepo);
    await useCase.execute('b1', 'u1', 'u2');
    expect(mockRepo.delete).toHaveBeenCalledWith('b1', 'u2');
  });

  it('throws ValidationError when trying to remove self', async () => {
    const useCase = new RemoveMemberUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u1', 'u1')).rejects.toThrow(ValidationError);
  });

  it('throws ForbiddenError when requester is not OWNER', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser).mockResolvedValue(editorMember);

    const useCase = new RemoveMemberUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u2', 'u1')).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when target is not a member', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser)
      .mockResolvedValueOnce(ownerMember)
      .mockResolvedValueOnce(null);

    const useCase = new RemoveMemberUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u1', 'u99')).rejects.toThrow(NotFoundError);
  });
});
