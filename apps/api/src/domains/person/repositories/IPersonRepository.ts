import type { Person, PersonType, Sex } from '../entities/Person.js';

export interface CreatePersonData {
  type: PersonType;
  name: string;
  sex: Sex;
  dob?: Date;
  plannedDob?: Date;
}

export interface UpdatePersonData {
  name?: string;
  sex?: Sex;
  dob?: Date | null;
  plannedDob?: Date | null;
}

export interface IPersonRepository {
  findById(id: string): Promise<Person | null>;
  findByBudget(budgetId: string): Promise<Person[]>;
  create(budgetId: string, data: CreatePersonData): Promise<Person>;
  update(id: string, data: UpdatePersonData): Promise<Person>;
  delete(id: string): Promise<void>;
}
