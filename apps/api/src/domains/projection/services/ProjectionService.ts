import type { Expense } from '../../expenses/entities/Expense.js';
import type { Revenue } from '../../revenues/entities/Revenue.js';
import type { Saving } from '../../savings/entities/Saving.js';
import type { Asset } from '../../assets/entities/Asset.js';
import type { Person } from '../../person/entities/Person.js';
import type { LoanPayment } from '../../expenses/entities/LoanPayment.js';
import type { ProjectionPoint, PersonAgePoint } from '../types.js';
import { monthlyAmount } from '../utils/frequencyUtils.js';

export interface ProjectionInput {
  startDate: Date;
  endDate: Date;
  initialSaving: number;
  expenses: Expense[];
  revenues: Revenue[];
  savings: Saving[];
  assets: Asset[];
  persons: Person[];
  loanPayments: LoanPayment[];
}

export interface ProjectionResult {
  points: ProjectionPoint[];
  persons: PersonAgePoint[];
}

export class ProjectionService {
  compute(input: ProjectionInput): ProjectionResult {
    const {
      startDate,
      endDate,
      initialSaving,
      expenses,
      revenues,
      savings,
      assets,
      persons,
      loanPayments,
    } = input;

    // Index loan payments by loanDetailId for fast lookup
    const paymentsByLoan = new Map<string, LoanPayment[]>();
    for (const p of loanPayments) {
      const list = paymentsByLoan.get(p.loanDetailId) ?? [];
      list.push(p);
      paymentsByLoan.set(p.loanDetailId, list);
    }

    // Revenues linked as asset sources are in-kind transfers — skip from cash flow
    const assetSourceRevenueIds = new Set(
      assets.map((a) => a.sourceRevenueId).filter((id): id is string => id !== null)
    );

    const loanExpenses = expenses.filter((e) => e.type === 'LOAN' && e.loanDetail);
    const regularExpenses = expenses.filter((e) => e.type === 'REGULAR');
    const cashRevenues = revenues.filter((r) => !assetSourceRevenueIds.has(r.id));

    const points: ProjectionPoint[] = [];
    let cashBalance = initialSaving;
    let savingsBalance = 0;

    let y = startDate.getFullYear();
    let m = startDate.getMonth();
    const ey = endDate.getFullYear();
    const em = endDate.getMonth();

    while (y < ey || (y === ey && m <= em)) {
      const date = new Date(y, m, 1);

      // Revenue (in-kind/asset-source revenues excluded)
      let revenue = 0;
      for (const r of cashRevenues) {
        revenue += monthlyAmount(
          {
            frequency: r.frequency,
            frequencyValue: r.frequencyValue,
            startDate: r.startDate,
            endDate: r.endDate,
            amount: r.amount,
          },
          y,
          m
        );
      }

      // Expense: regular
      let expense = 0;
      for (const e of regularExpenses) {
        expense += monthlyAmount(
          {
            frequency: e.frequency,
            frequencyValue: e.frequencyValue,
            startDate: e.startDate,
            endDate: e.endDate,
            amount: e.amount,
          },
          y,
          m
        );
      }

      // Expense: loan payments (find exact month)
      let loanBalance = 0;
      for (const e of loanExpenses) {
        const ld = e.loanDetail!;
        const payments = paymentsByLoan.get(ld.id) ?? [];

        // Find payment in this exact month
        const thisMonthPayment = payments.find(
          (p) => p.paymentDate.getFullYear() === y && p.paymentDate.getMonth() === m
        );
        if (thisMonthPayment) {
          expense += thisMonthPayment.amount;
        }

        // Remaining balance: latest payment on or before end of this month
        const monthEnd = new Date(y, m + 1, 0);
        const pastPayments = payments
          .filter((p) => p.paymentDate <= monthEnd)
          .sort((a, b) => b.paymentNumber - a.paymentNumber);

        if (pastPayments.length === 0) {
          loanBalance += ld.totalAmount;
        } else {
          loanBalance += pastPayments[0].remainingBalance;
        }
      }

      // Savings contribution
      let savingContribution = 0;
      for (const s of savings) {
        savingContribution += monthlyAmount(
          {
            frequency: s.frequency,
            frequencyValue: s.frequencyValue,
            startDate: s.startDate,
            endDate: s.endDate,
            amount: s.amount,
          },
          y,
          m
        );
      }

      // Asset value
      let assetValue = 0;
      for (const a of assets) {
        assetValue += a.valueAt(date);
      }

      cashBalance += revenue - expense - savingContribution;
      savingsBalance += savingContribution;
      const netWorth = cashBalance + savingsBalance + assetValue - loanBalance;

      points.push({
        date,
        revenue: Math.round(revenue * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        savingContribution: Math.round(savingContribution * 100) / 100,
        assetValue: Math.round(assetValue * 100) / 100,
        loanBalance: Math.round(loanBalance * 100) / 100,
        cashBalance: Math.round(cashBalance * 100) / 100,
        savingsBalance: Math.round(savingsBalance * 100) / 100,
        netWorth: Math.round(netWorth * 100) / 100,
      });

      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }

    // Person age points
    const yearStart = startDate.getFullYear();
    const yearEnd = endDate.getFullYear();
    const personPoints: PersonAgePoint[] = persons.map((p) => {
      const ageByYear: Record<number, number | null> = {};
      const ref = p.dob ?? p.plannedDob;
      for (let yr = yearStart; yr <= yearEnd; yr++) {
        if (!ref) {
          ageByYear[yr] = null;
        } else if (yr < ref.getFullYear()) {
          ageByYear[yr] = null;
        } else {
          ageByYear[yr] = yr - ref.getFullYear();
        }
      }
      return { personId: p.id, name: p.name, type: p.type, ageByYear };
    });

    return { points, persons: personPoints };
  }

  /** Aggregate monthly points into yearly points (last balance of the year, summed flows). */
  aggregate(points: ProjectionPoint[]): ProjectionPoint[] {
    const byYear = new Map<number, ProjectionPoint[]>();
    for (const p of points) {
      const y = p.date.getFullYear();
      const list = byYear.get(y) ?? [];
      list.push(p);
      byYear.set(y, list);
    }
    const result: ProjectionPoint[] = [];
    for (const [, pts] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
      const last = pts[pts.length - 1];
      result.push({
        date: new Date(last.date.getFullYear(), 11, 1),
        revenue: pts.reduce((s, p) => s + p.revenue, 0),
        expense: pts.reduce((s, p) => s + p.expense, 0),
        savingContribution: pts.reduce((s, p) => s + p.savingContribution, 0),
        assetValue: last.assetValue,
        loanBalance: last.loanBalance,
        cashBalance: last.cashBalance,
        savingsBalance: last.savingsBalance,
        netWorth: last.netWorth,
      });
    }
    return result;
  }
}
