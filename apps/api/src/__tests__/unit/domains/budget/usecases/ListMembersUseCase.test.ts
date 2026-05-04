import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { ListMembersUseCase } from '../../../../../domains/budget/usecases/ListMembersUseCase.js';
import type { IBudgetMemberRepository } from '../../../../../domains/budget/repositories/IBudgetMemberRepository.js';
import { BudgetMember } from '../../../../../domains/budget/entities/BudgetMember.js';
import { ForbiddenError } from '../../../../../infrastructure/errors/DomainError.js';

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

describe('ListMembersUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns members when requester is a member', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockRepo.findByBudget).mockResolvedValue([ownerMember, editorMember]);

    const useCase = new ListMembersUseCase(mockRepo);
    const result = await useCase.execute('b1', 'u1');
    expect(result).toHaveLength(2);
  });

  it('throws ForbiddenError when requester is not a member', async () => {
    vi.mocked(mockRepo.findByBudgetAndUser).mockResolvedValue(null);

    const useCase = new ListMembersUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u99')).rejects.toThrow(ForbiddenError);
  });
});
