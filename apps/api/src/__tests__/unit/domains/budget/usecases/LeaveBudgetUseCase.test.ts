import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { LeaveBudgetUseCase } from '../../../../../domains/budget/usecases/LeaveBudgetUseCase.js';
import type { IBudgetMemberRepository } from '../../../../../domains/budget/repositories/IBudgetMemberRepository.js';
import { BudgetMember } from '../../../../../domains/budget/entities/BudgetMember.js';
import {
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

describe('LeaveBudgetUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes non-owner member', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser).mockResolvedValue(editorMember);
    vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

    const useCase = new LeaveBudgetUseCase(mockRepo);
    await useCase.execute('b1', 'u2');
    expect(mockRepo.delete).toHaveBeenCalledWith('b1', 'u2');
  });

  it('throws ValidationError when owner tries to leave', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);

    const useCase = new LeaveBudgetUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u1')).rejects.toThrow(ValidationError);
  });

  it('throws NotFoundError when user is not a member', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser).mockResolvedValue(null);

    const useCase = new LeaveBudgetUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u99')).rejects.toThrow(NotFoundError);
  });
});
