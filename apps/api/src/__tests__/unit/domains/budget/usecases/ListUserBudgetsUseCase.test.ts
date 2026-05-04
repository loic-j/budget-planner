import { describe, it, expect, vi } from 'vitest';
import 'reflect-metadata';
import { ListUserBudgetsUseCase } from '../../../../../domains/budget/usecases/ListUserBudgetsUseCase.js';
import type { IBudgetRepository } from '../../../../../domains/budget/repositories/IBudgetRepository.js';
import { Budget } from '../../../../../domains/budget/entities/Budget.js';

const now = new Date();
const budgets = [
  new Budget('b1', 'Budget 1', 'u1', now, now, 'EUR', 0, now, now),
  new Budget('b2', 'Budget 2', 'u1', now, now, 'USD', 100, now, now),
];

const mockRepo: IBudgetRepository = {
  findById: vi.fn(),
  findByMember: vi.fn().mockResolvedValue(budgets),
  findMember: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('ListUserBudgetsUseCase', () => {
  it('returns all budgets for user', async () => {
    const useCase = new ListUserBudgetsUseCase(mockRepo);
    const result = await useCase.execute('u1');
    expect(result).toHaveLength(2);
    expect(mockRepo.findByMember).toHaveBeenCalledWith('u1');
  });

  it('returns empty array when user has no budgets', async () => {
    vi.mocked(mockRepo.findByMember).mockResolvedValueOnce([]);
    const useCase = new ListUserBudgetsUseCase(mockRepo);
    const result = await useCase.execute('u1');
    expect(result).toEqual([]);
  });
});
