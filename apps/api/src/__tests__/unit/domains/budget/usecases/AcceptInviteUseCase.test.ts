import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { AcceptInviteUseCase } from '../../../../../domains/budget/usecases/AcceptInviteUseCase.js';
import type { IBudgetMemberRepository } from '../../../../../domains/budget/repositories/IBudgetMemberRepository.js';
import type { IBudgetInviteRepository } from '../../../../../domains/budget/repositories/IBudgetInviteRepository.js';
import { BudgetMember } from '../../../../../domains/budget/entities/BudgetMember.js';
import { BudgetInvite } from '../../../../../domains/budget/entities/BudgetInvite.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../../../../infrastructure/errors/DomainError.js';

const now = new Date();
const future = new Date(Date.now() + 86400000);
const past = new Date(Date.now() - 86400000);

const validInvite = new BudgetInvite('inv1', 'b1', 'tok1', 'EDITOR', 'u1', now, null, null, 0);
const expiredInvite = new BudgetInvite('inv2', 'b1', 'tok2', 'EDITOR', 'u1', now, past, null, 0);
const maxedInvite = new BudgetInvite('inv3', 'b1', 'tok3', 'EDITOR', 'u1', now, future, 1, 1);
const newMember = new BudgetMember('m2', 'b1', 'u2', 'EDITOR', now, 'user2@test.com', 'User 2');

const mockMemberRepo: IBudgetMemberRepository = {
  findByBudget: vi.fn(),
  findByBudgetAndUser: vi.fn(),
  create: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
};

const mockInviteRepo: IBudgetInviteRepository = {
  findByToken: vi.fn(),
  findByBudget: vi.fn(),
  create: vi.fn(),
  incrementUseCount: vi.fn(),
  delete: vi.fn(),
};

describe('AcceptInviteUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates member and increments use count for valid invite', async () => {
    vi.mocked(mockInviteRepo.findByToken).mockResolvedValue(validInvite);
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(null);
    vi.mocked(mockMemberRepo.create).mockResolvedValue(newMember);
    vi.mocked(mockInviteRepo.incrementUseCount).mockResolvedValue(undefined);

    const useCase = new AcceptInviteUseCase(mockMemberRepo, mockInviteRepo);
    const result = await useCase.execute('tok1', 'u2');
    expect(result).toBe(newMember);
    expect(mockInviteRepo.incrementUseCount).toHaveBeenCalledWith('inv1');
  });

  it('throws NotFoundError for unknown token', async () => {
    vi.mocked(mockInviteRepo.findByToken).mockResolvedValue(null);

    const useCase = new AcceptInviteUseCase(mockMemberRepo, mockInviteRepo);
    await expect(useCase.execute('bad', 'u2')).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError for expired invite', async () => {
    vi.mocked(mockInviteRepo.findByToken).mockResolvedValue(expiredInvite);

    const useCase = new AcceptInviteUseCase(mockMemberRepo, mockInviteRepo);
    await expect(useCase.execute('tok2', 'u2')).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when max uses reached', async () => {
    vi.mocked(mockInviteRepo.findByToken).mockResolvedValue(maxedInvite);

    const useCase = new AcceptInviteUseCase(mockMemberRepo, mockInviteRepo);
    await expect(useCase.execute('tok3', 'u2')).rejects.toThrow(ValidationError);
  });

  it('throws ConflictError when user is already a member', async () => {
    vi.mocked(mockInviteRepo.findByToken).mockResolvedValue(validInvite);
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(newMember);

    const useCase = new AcceptInviteUseCase(mockMemberRepo, mockInviteRepo);
    await expect(useCase.execute('tok1', 'u2')).rejects.toThrow(ConflictError);
  });
});
