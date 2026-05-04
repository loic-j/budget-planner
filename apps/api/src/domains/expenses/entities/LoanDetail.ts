export type LoanType = 'MORTGAGE' | 'CAR_LOAN' | 'PERSONAL' | 'STUDENT' | 'OTHER';

export class LoanDetail {
  constructor(
    public readonly id: string,
    public readonly expenseId: string,
    public readonly loanType: LoanType,
    public readonly totalAmount: number,
    public readonly interestRate: number,
    public readonly durationMonths: number,
    public readonly monthlyPayment: number,
    public readonly loanStartDate: Date
  ) {}
}
