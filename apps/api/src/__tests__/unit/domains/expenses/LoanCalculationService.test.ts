import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
} from '../../../../domains/expenses/services/LoanCalculationService.js';
import { LoanDetail } from '../../../../domains/expenses/entities/LoanDetail.js';

describe('calculateMonthlyPayment', () => {
  it('computes standard mortgage payment correctly', () => {
    // €200,000 at 3.6% for 20 years (240 months)
    const pmt = calculateMonthlyPayment(200_000, 3.6, 240);
    // Standard annuity: r=0.003, factor=(1.003)^240≈2.0523 → ~1170.22
    expect(pmt).toBeCloseTo(1170.22, 1);
  });

  it('returns equal principal slices at 0% interest', () => {
    const pmt = calculateMonthlyPayment(12_000, 0, 12);
    expect(pmt).toBe(1000);
  });

  it('handles single-month loan', () => {
    const pmt = calculateMonthlyPayment(1000, 12, 1);
    expect(pmt).toBeCloseTo(1010, 0);
  });
});

describe('generateAmortizationSchedule', () => {
  const startDate = new Date('2024-01-01');

  function makeLoan(totalAmount: number, interestRate: number, durationMonths: number): LoanDetail {
    const pmt = calculateMonthlyPayment(totalAmount, interestRate, durationMonths);
    return new LoanDetail(
      'ld1',
      'e1',
      'MORTGAGE',
      totalAmount,
      interestRate,
      durationMonths,
      pmt,
      startDate
    );
  }

  it('generates correct number of payments for 30-year mortgage', () => {
    const loan = makeLoan(300_000, 4.0, 360);
    const schedule = generateAmortizationSchedule(loan);
    expect(schedule).toHaveLength(360);
  });

  it('last payment brings remaining balance to 0', () => {
    const loan = makeLoan(100_000, 5.0, 120);
    const schedule = generateAmortizationSchedule(loan);
    expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
  });

  it('first payment date matches loan start date', () => {
    const loan = makeLoan(50_000, 3.0, 60);
    const schedule = generateAmortizationSchedule(loan);
    expect(schedule[0].paymentDate.toISOString().slice(0, 10)).toBe('2024-01-01');
  });

  it('payment numbers are sequential from 1', () => {
    const loan = makeLoan(10_000, 6.0, 12);
    const schedule = generateAmortizationSchedule(loan);
    schedule.forEach((p, i) => expect(p.paymentNumber).toBe(i + 1));
  });

  it('each payment amount equals principal + interest', () => {
    const loan = makeLoan(50_000, 4.8, 24);
    const schedule = generateAmortizationSchedule(loan);
    for (const p of schedule) {
      expect(p.amount).toBeCloseTo(p.principalAmount + p.interestAmount, 5);
    }
  });

  it('total principal paid equals loan amount', () => {
    const loan = makeLoan(100_000, 3.6, 120);
    const schedule = generateAmortizationSchedule(loan);
    const totalPrincipal = schedule.reduce((s, p) => s + p.principalAmount, 0);
    expect(totalPrincipal).toBeCloseTo(100_000, 0);
  });

  it('handles 0% interest — equal principal payments', () => {
    const loan = makeLoan(12_000, 0, 12);
    const schedule = generateAmortizationSchedule(loan);
    expect(schedule).toHaveLength(12);
    schedule.forEach((p) => expect(p.interestAmount).toBe(0));
    expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
  });
});
