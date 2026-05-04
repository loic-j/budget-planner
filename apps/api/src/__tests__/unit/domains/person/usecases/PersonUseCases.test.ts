import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { ListPersonsUseCase } from '../../../../../domains/person/usecases/ListPersonsUseCase.js';
import { CreatePersonUseCase } from '../../../../../domains/person/usecases/CreatePersonUseCase.js';
import { UpdatePersonUseCase } from '../../../../../domains/person/usecases/UpdatePersonUseCase.js';
import { DeletePersonUseCase } from '../../../../../domains/person/usecases/DeletePersonUseCase.js';
import type { IPersonRepository } from '../../../../../domains/person/repositories/IPersonRepository.js';
import type { IBudgetMemberRepository } from '../../../../../domains/budget/repositories/IBudgetMemberRepository.js';
import { Person } from '../../../../../domains/person/entities/Person.js';
import { BudgetMember } from '../../../../../domains/budget/entities/BudgetMember.js';
import { ForbiddenError, NotFoundError } from '../../../../../infrastructure/errors/DomainError.js';

const now = new Date();
const dob = new Date('1990-01-01');

const ownerMember = new BudgetMember('m1', 'b1', 'u1', 'OWNER', now, 'owner@test.com', 'Owner');
const viewerMember = new BudgetMember('m2', 'b1', 'u2', 'VIEWER', now, 'viewer@test.com', 'Viewer');
const adultPerson = new Person('p1', 'b1', 'ADULT', 'Alice', 'FEMALE', now, now, dob, null);

const mockPersonRepo: IPersonRepository = {
  findById: vi.fn(),
  findByBudget: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockMemberRepo: IBudgetMemberRepository = {
  findByBudget: vi.fn(),
  findByBudgetAndUser: vi.fn(),
  create: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
};

describe('ListPersonsUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns persons for budget members', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockPersonRepo.findByBudget).mockResolvedValue([adultPerson]);

    const uc = new ListPersonsUseCase(mockPersonRepo, mockMemberRepo);
    const result = await uc.execute('b1', 'u1');
    expect(result).toHaveLength(1);
  });

  it('throws ForbiddenError for non-members', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(null);

    const uc = new ListPersonsUseCase(mockPersonRepo, mockMemberRepo);
    await expect(uc.execute('b1', 'u99')).rejects.toThrow(ForbiddenError);
  });
});

describe('CreatePersonUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates person for OWNER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockPersonRepo.create).mockResolvedValue(adultPerson);

    const uc = new CreatePersonUseCase(mockPersonRepo, mockMemberRepo);
    const result = await uc.execute('b1', 'u1', {
      type: 'ADULT',
      name: 'Alice',
      sex: 'FEMALE',
      dob,
    });
    expect(result).toBe(adultPerson);
  });

  it('throws ForbiddenError for VIEWER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(viewerMember);

    const uc = new CreatePersonUseCase(mockPersonRepo, mockMemberRepo);
    await expect(
      uc.execute('b1', 'u2', { type: 'ADULT', name: 'Alice', sex: 'FEMALE', dob })
    ).rejects.toThrow(ForbiddenError);
  });
});

describe('UpdatePersonUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates person for OWNER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockPersonRepo.findById).mockResolvedValue(adultPerson);
    const updated = new Person('p1', 'b1', 'ADULT', 'Alice Updated', 'FEMALE', now, now, dob, null);
    vi.mocked(mockPersonRepo.update).mockResolvedValue(updated);

    const uc = new UpdatePersonUseCase(mockPersonRepo, mockMemberRepo);
    const result = await uc.execute('b1', 'p1', 'u1', { name: 'Alice Updated' });
    expect(result.name).toBe('Alice Updated');
  });

  it('throws NotFoundError when person not in budget', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockPersonRepo.findById).mockResolvedValue(null);

    const uc = new UpdatePersonUseCase(mockPersonRepo, mockMemberRepo);
    await expect(uc.execute('b1', 'p99', 'u1', { name: 'x' })).rejects.toThrow(NotFoundError);
  });
});

describe('DeletePersonUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes person for OWNER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(ownerMember);
    vi.mocked(mockPersonRepo.findById).mockResolvedValue(adultPerson);
    vi.mocked(mockPersonRepo.delete).mockResolvedValue(undefined);

    const uc = new DeletePersonUseCase(mockPersonRepo, mockMemberRepo);
    await uc.execute('b1', 'p1', 'u1');
    expect(mockPersonRepo.delete).toHaveBeenCalledWith('p1');
  });

  it('throws ForbiddenError for VIEWER', async () => {
    vi.mocked(mockMemberRepo.findByBudgetAndUser).mockResolvedValue(viewerMember);

    const uc = new DeletePersonUseCase(mockPersonRepo, mockMemberRepo);
    await expect(uc.execute('b1', 'p1', 'u2')).rejects.toThrow(ForbiddenError);
  });
});
