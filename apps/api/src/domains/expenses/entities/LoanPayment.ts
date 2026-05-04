export class LoanPayment {
  constructor(
    public readonly id: string,
    public readonly loanDetailId: string,
    public readonly paymentNumber: number,
    public readonly paymentDate: Date,
    public readonly amount: number,
    public readonly principalAmount: number,
    public readonly interestAmount: number,
    public readonly remainingBalance: number,
    public readonly createdAt: Date
  ) {}
}
