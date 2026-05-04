import type { LoanDetail } from '../entities/LoanDetail.js';

export interface LoanPaymentData {
  paymentNumber: number;
  paymentDate: Date;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  durationMonths: number
): number {
  // 0% interest: equal principal payments
  if (annualRate === 0) {
    return round(principal / durationMonths);
  }
  const r = annualRate / 100 / 12;
  const factor = Math.pow(1 + r, durationMonths);
  return round((principal * r * factor) / (factor - 1));
}

export function generateAmortizationSchedule(loan: LoanDetail): LoanPaymentData[] {
  const payments: LoanPaymentData[] = [];
  let balance = loan.totalAmount;
  const r = loan.interestRate / 100 / 12;
  const pmt = loan.monthlyPayment;

  for (let i = 1; i <= loan.durationMonths; i++) {
    const paymentDate = addMonths(loan.loanStartDate, i - 1);
    const interest = round(balance * r);
    // On last payment, pay exact remaining balance to avoid rounding drift
    const principal = i === loan.durationMonths ? round(balance) : round(pmt - interest);
    const newBalance = round(Math.max(0, balance - principal));

    payments.push({
      paymentNumber: i,
      paymentDate,
      amount: round(principal + interest),
      principalAmount: principal,
      interestAmount: interest,
      remainingBalance: newBalance,
    });

    balance = newBalance;
  }

  return payments;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
