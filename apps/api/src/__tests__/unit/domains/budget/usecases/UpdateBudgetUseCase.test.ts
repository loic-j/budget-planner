import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { UpdateBudgetUseCase } from '../../../../../domains/budget/usecases/UpdateBudgetUseCase.js';
import type { IBudgetRepository } from '../../../../../domains/budget/repositories/IBudgetRepository.js';
import { Budget } from '../../../../../domains/budget/entities/Budget.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../../../infrastructure/errors/DomainError.js';

const now = new Date();
const mockBudget = new Budget('b1', 'Budget', 'u1', now, now, 'EUR', 0, now, now);
const updatedBudget = new Budget('b1', 'Renamed', 'u1', now, now, 'EUR', 0, now, now);

const mockRepo: IBudgetRepository = {
  findById: vi.fn(),
  findByMember: vi.fn(),
  findMember: vi.fn(),
  create: vi.fn(),
  update: vi.fn().mockResolvedValue(updatedBudget),
  delete: vi.fn(),
};

describe('UpdateBudgetUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('OWNER can update name', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u1',
      role: 'OWNER',
    });

    const useCase = new UpdateBudgetUseCase(mockRepo);
    const result = await useCase.execute({ budgetId: 'b1', userId: 'u1', name: 'Renamed' });
    expect(result).toBe(updatedBudget);
    expect(mockRepo.update).toHaveBeenCalledWith('b1', { name: 'Renamed' });
  });

  it('EDITOR can update description and initialSaving', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u2',
      role: 'EDITOR',
    });

    const useCase = new UpdateBudgetUseCase(mockRepo);
    await useCase.execute({
      budgetId: 'b1',
      userId: 'u2',
      description: 'new desc',
      initialSaving: 200,
    });
    expect(mockRepo.update).toHaveBeenCalledWith('b1', {
      description: 'new desc',
      initialSaving: 200,
    });
  });

  it('EDITOR cannot change name', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u2',
      role: 'EDITOR',
    });

    const useCase = new UpdateBudgetUseCase(mockRepo);
    await expect(useCase.execute({ budgetId: 'b1', userId: 'u2', name: 'Hacked' })).rejects.toThrow(
      ValidationError
    );
  });

  it('EDITOR cannot change currency', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u2',
      role: 'EDITOR',
    });

    const useCase = new UpdateBudgetUseCase(mockRepo);
    await expect(
      useCase.execute({ budgetId: 'b1', userId: 'u2', currency: 'USD' })
    ).rejects.toThrow(ValidationError);
  });

  it('VIEWER cannot edit', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue({
      budgetId: 'b1',
      userId: 'u3',
      role: 'VIEWER',
    });

    const useCase = new UpdateBudgetUseCase(mockRepo);
    await expect(
      useCase.execute({ budgetId: 'b1', userId: 'u3', description: 'x' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when budget missing', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    const useCase = new UpdateBudgetUseCase(mockRepo);
    await expect(useCase.execute({ budgetId: 'b99', userId: 'u1', name: 'X' })).rejects.toThrow(
      NotFoundError
    );
  });

  it('throws ForbiddenError when not a member', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(mockBudget);
    vi.mocked(mockRepo.findMember).mockResolvedValue(null);

    const useCase = new UpdateBudgetUseCase(mockRepo);
    await expect(useCase.execute({ budgetId: 'b1', userId: 'u99', name: 'X' })).rejects.toThrow(
      ForbiddenError
    );
  });
});
