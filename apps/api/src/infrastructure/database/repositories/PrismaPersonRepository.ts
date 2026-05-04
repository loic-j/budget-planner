import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import type { Person as PrismaPerson } from '@prisma/client';
import { Person } from '../../../domains/person/entities/Person.js';
import type {
  IPersonRepository,
  CreatePersonData,
  UpdatePersonData,
} from '../../../domains/person/repositories/IPersonRepository.js';
import type { PersonType, Sex } from '../../../domains/person/entities/Person.js';
import { NotFoundError } from '../../errors/DomainError.js';

@injectable()
export class PrismaPersonRepository implements IPersonRepository {
  constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

  async findById(id: string): Promise<Person | null> {
    const row = await this.prisma.person.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByBudget(budgetId: string): Promise<Person[]> {
    const rows = await this.prisma.person.findMany({
      where: { budgetId },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(budgetId: string, data: CreatePersonData): Promise<Person> {
    const row = await this.prisma.person.create({
      data: {
        budgetId,
        type: data.type,
        name: data.name,
        sex: data.sex,
        dob: data.dob,
        planned_dob: data.plannedDob,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: UpdatePersonData): Promise<Person> {
    try {
      const row = await this.prisma.person.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.sex !== undefined && { sex: data.sex }),
          ...(data.dob !== undefined && { dob: data.dob }),
          ...(data.plannedDob !== undefined && { planned_dob: data.plannedDob }),
        },
      });
      return this.toDomain(row);
    } catch {
      throw new NotFoundError(`Person ${id} not found`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.person.delete({ where: { id } });
  }

  private toDomain(row: PrismaPerson): Person {
    return new Person(
      row.id,
      row.budgetId,
      row.type as PersonType,
      row.name,
      row.sex as Sex,
      row.created_at,
      row.updated_at,
      row.dob,
      row.planned_dob
    );
  }
}
