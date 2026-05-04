import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { GetBudgetUseCase } from '../../../../../domains/budget/usecases/GetBudgetUseCase.js';
import type { IBudgetRepository } from '../../../../../domains/budget/repositories/IBudgetRepository.js';
import { Budget } from '../../../../../domains/budget/entities/Budget.js';
import { NotFoundError, ForbiddenError } from '../../../../../infrastructure/errors/DomainError.js';

const now = new Date();
const mockBudget = new Budget('b1', 'Test', 'u1', now, now, 'EUR', 0, now, now);

const mockRepo: IBudgetRepository = {
  findById: vi.fn(),
  findByMember: vi.fn(),
  findMember: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('GetBudgetUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns budget when user is a member', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u1',
      role: 'OWNER',
    });

    const useCase = new GetBudgetUseCase(mockRepo);
    const result = await useCase.execute('b1', 'u1');
    expect(result).toBe(mockBudget);
  });

  it('throws NotFoundError when budget does not exist', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    const useCase = new GetBudgetUseCase(mockRepo);
    await expect(useCase.execute('b99', 'u1')).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when user is not a member', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue(null);

    const useCase = new GetBudgetUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u2')).rejects.toThrow(ForbiddenError);
  });
});
