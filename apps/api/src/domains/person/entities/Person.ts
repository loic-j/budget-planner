export type PersonType = 'ADULT' | 'CHILD';
export type Sex = 'MALE' | 'FEMALE' | 'OTHER';

export class Person {
  constructor(
    public readonly id: string,
    public readonly budgetId: string,
    public readonly type: PersonType,
    public readonly name: string,
    public readonly sex: Sex,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly dob: Date | null = null,
    public readonly plannedDob: Date | null = null
  ) {}

  get age(): number | null {
    const ref = this.dob ?? this.plannedDob;
    if (!ref) return null;
    const today = new Date();
    let age = today.getFullYear() - ref.getFullYear();
    const m = today.getMonth() - ref.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < ref.getDate())) age--;
    return age;
  }
}
