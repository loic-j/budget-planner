import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { DeleteBudgetUseCase } from '../../../../../domains/budget/usecases/DeleteBudgetUseCase.js';
import type { IBudgetRepository } from '../../../../../domains/budget/repositories/IBudgetRepository.js';
import { Budget } from '../../../../../domains/budget/entities/Budget.js';
import { NotFoundError, ForbiddenError } from '../../../../../infrastructure/errors/DomainError.js';

const now = new Date();
const mockBudget = new Budget('b1', 'Budget', 'u1', now, now, 'EUR', 0, now, now);

const mockRepo: IBudgetRepository = {
  findById: vi.fn(),
  findByMember: vi.fn(),
  findMember: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('DeleteBudgetUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('OWNER can delete budget', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u1',
      role: 'OWNER',
    });

    const useCase = new DeleteBudgetUseCase(mockRepo);
    await useCase.execute('b1', 'u1');
    expect(mockRepo.delete).toHaveBeenCalledWith('b1');
  });

  it('EDITOR cannot delete budget', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u2',
      role: 'EDITOR',
    });

    const useCase = new DeleteBudgetUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u2')).rejects.toThrow(ForbiddenError);
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('non-member cannot delete budget', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue(null);

    const useCase = new DeleteBudgetUseCase(mockRepo);
    await expect(useCase.execute('b1', 'u99')).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when budget missing', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    const useCase = new DeleteBudgetUseCase(mockRepo);
    await expect(useCase.execute('b99', 'u1')).rejects.toThrow(NotFoundError);
  });
});
