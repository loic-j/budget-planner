import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { ListCategoriesUseCase } from '../../../../../domains/categories/usecases/ListCategoriesUseCase.js';
import { CreateCategoryUseCase } from '../../../../../domains/categories/usecases/CreateCategoryUseCase.js';
import { UpdateCategoryUseCase } from '../../../../../domains/categories/usecases/UpdateCategoryUseCase.js';
import { DeleteCategoryUseCase } from '../../../../../domains/categories/usecases/DeleteCategoryUseCase.js';
import { SeedPresetCategoriesUseCase } from '../../../../../domains/categories/usecases/SeedPresetCategoriesUseCase.js';
import type { ICategoryRepository } from '../../../../../domains/categories/repositories/ICategoryRepository.js';
import type { IBudgetMemberRepository } from '../../../../../domains/budget/repositories/IBudgetMemberRepository.js';
import { Category } from '../../../../../domains/categories/entities/Category.js';
import { BudgetMember } from '../../../../../domains/budget/entities/BudgetMember.js';
import { PRESET_CATEGORIES } from '../../../../../domains/categories/constants/presetCategories.js';
import { ForbiddenError, NotFoundError } from '../../../../../infrastructure/errors/DomainError.js';

const now = new Date();

const ownerMember = new BudgetMember('m1', 'b1', 'u1', 'OWNER', now, 'owner@test.com', 'Owner');
const viewerMember = new BudgetMember('m2', 'b1', 'u2', 'VIEWER', now, 'viewer@test.com', 'Viewer');
const foodCategory = new Category('c1', 'b1', 'EXPENSE', 'Food', 'food', true, now);
const customCategory = new Category('c2', 'b1', 'EXPENSE', 'Custom', 'star', false, now);

const mockCategoryRepo: ICategoryRepository = {
  findById: vi.fn(),
  findByBudget: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  bulkCreate: vi.fn(),
};

const mockMemberRepo: IBudgetMemberRepository = {
  findByBudget: vi.fn(),
  findByBudgetAndUser: vi.fn(),
  create: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
};

describe('ListCategoriesUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns categories for budget members', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockCategoryRepo.findByBudget).mockResolvedValue([foodCategory, customCategory]);

    const uc = new ListCategoriesUseCase(mockCategoryRepo, mockMemberRepo);
    const result = await uc.execute('b1', 'u1');
    expect(result).toHaveLength(2);
    expect(mockCategoryRepo.findByBudget).toHaveBeenCalledWith('b1', undefined);
  });

  it('passes type filter to repository', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockCategoryRepo.findByBudget).mockResolvedValue([foodCategory]);

    const uc = new ListCategoriesUseCase(mockCategoryRepo, mockMemberRepo);
    await uc.execute('b1', 'u1', 'EXPENSE');
    expect(mockCategoryRepo.findByBudget).toHaveBeenCalledWith('b1', 'EXPENSE');
  });

  it('throws ForbiddenError for non-members', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(null);

    const uc = new ListCategoriesUseCase(mockCategoryRepo, mockMemberRepo);
    await expect(uc.execute('b1', 'u99')).rejects.toThrow(ForbiddenError);
  });
});

describe('CreateCategoryUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates category for OWNER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockCategoryRepo.create).mockResolvedValue(customCategory);

    const uc = new CreateCategoryUseCase(mockCategoryRepo, mockMemberRepo);
    const result = await uc.execute('b1', 'u1', {
      type: 'EXPENSE',
      name: 'Custom',
      icon: 'star',
    });
    expect(result).toBe(customCategory);
    expect(mockCategoryRepo.create).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ isPreset: false })
    );
  });

  it('throws ForbiddenError for VIEWER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(viewerMember);

    const uc = new CreateCategoryUseCase(mockCategoryRepo, mockMemberRepo);
    await expect(uc.execute('b1', 'u2', { type: 'EXPENSE', name: 'x', icon: 'x' })).rejects.toThrow(
      ForbiddenError
    );
  });
});

describe('UpdateCategoryUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates category for OWNER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockCategoryRepo.findById).mockResolvedValue(foodCategory);
    const updated = new Category('c1', 'b1', 'EXPENSE', 'Food Updated', 'food', true, now);
    vi.mocked(mockCategoryRepo.update).mockResolvedValue(updated);

    const uc = new UpdateCategoryUseCase(mockCategoryRepo, mockMemberRepo);
    const result = await uc.execute('b1', 'c1', 'u1', { name: 'Food Updated' });
    expect(result.name).toBe('Food Updated');
  });

  it('throws NotFoundError for wrong budget', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockCategoryRepo.findById).mockResolvedValue(null);

    const uc = new UpdateCategoryUseCase(mockCategoryRepo, mockMemberRepo);
    await expect(uc.execute('b1', 'c99', 'u1', { name: 'x' })).rejects.toThrow(NotFoundError);
  });
});

describe('DeleteCategoryUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes category for OWNER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockCategoryRepo.findById).mockResolvedValue(foodCategory);
    vi.mocked(mockCategoryRepo.delete).mockResolvedValue(undefined);

    const uc = new DeleteCategoryUseCase(mockCategoryRepo, mockMemberRepo);
    await uc.execute('b1', 'c1', 'u1');
    expect(mockCategoryRepo.delete).toHaveBeenCalledWith('c1');
  });
});

describe('SeedPresetCategoriesUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bulk-creates all preset categories', async () => {
    vi.mocked(mockCategoryRepo.bulkCreate).mockResolvedValue(undefined);

    const uc = new SeedPresetCategoriesUseCase(mockCategoryRepo);
    await uc.execute('b1');

    expect(mockCategoryRepo.bulkCreate).toHaveBeenCalledWith(
      'b1',
      expect.arrayContaining([expect.objectContaining({ isPreset: true })])
    );
    const [, items] = vi.mocked(mockCategoryRepo.bulkCreate).mock.calls[0];
    expect(items).toHaveLength(PRESET_CATEGORIES.length);
  });
});
