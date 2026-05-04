import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { CreateBudgetUseCase } from '../../../../../domains/budget/usecases/CreateBudgetUseCase.js';
import type { IBudgetRepository } from '../../../../../domains/budget/repositories/IBudgetRepository.js';
import { Budget } from '../../../../../domains/budget/entities/Budget.js';
import { SeedPresetCategoriesUseCase } from '../../../../../domains/categories/usecases/SeedPresetCategoriesUseCase.js';

const now = new Date();
const mockBudget = new Budget('b1', 'My Budget', 'u1', now, now, 'EUR', 0, now, now);

const mockRepo: IBudgetRepository = {
  findById: vi.fn(),
  findByMember: vi.fn(),
  findMember: vi.fn(),
  create: vi.fn().mockResolvedValue(mockBudget),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockSeedCategories = {
  execute: vi.fn().mockResolvedValue(undefined),
} as unknown as SeedPresetCategoriesUseCase;

describe('CreateBudgetUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls repo.create with correct data and returns budget', async () => {
    const useCase = new CreateBudgetUseCase(mockRepo, mockSeedCategories);
    const result = await useCase.execute({
      name: 'My Budget',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      currency: 'EUR',
      initialSaving: 0,
      ownerId: 'u1',
    });

    expect(mockRepo.create).toHaveBeenCalledOnce();
    const arg = vi.mocked(mockRepo.create).mock.calls[0][0];
    expect(arg.name).toBe('My Budget');
    expect(arg.ownerId).toBe('u1');
    expect(arg.startDate).toBeInstanceOf(Date);
    expect(result).toBe(mockBudget);
  });

  it('passes description when provided', async () => {
    const useCase = new CreateBudgetUseCase(mockRepo, mockSeedCategories);
    await useCase.execute({
      name: 'X',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      currency: 'USD',
      initialSaving: 500,
      ownerId: 'u1',
      description: 'desc',
    });
    const arg = vi.mocked(mockRepo.create).mock.calls[0][0];
    expect(arg.description).toBe('desc');
    expect(arg.initialSaving).toBe(500);
  });
});
