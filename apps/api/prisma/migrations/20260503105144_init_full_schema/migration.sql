/*
  Warnings:

  - Added the required column `end_date` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `Budget` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('ADULT', 'CHILD');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'REVENUE', 'SAVING');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('LOAN', 'REGULAR');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('MORTGAGE', 'CAR_LOAN', 'PERSONAL', 'STUDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'YEARLY', 'EVERY_X_MONTHS', 'EVERY_X_YEARS');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('REAL_ESTATE', 'INVESTMENT', 'VEHICLE', 'OTHER');

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "initial_saving" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "BudgetInvite" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "BudgetRole" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "max_uses" INTEGER,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "type" "PersonType" NOT NULL,
    "name" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "dob" TIMESTAMP(3),
    "planned_dob" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "personId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "frequency_value" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanDetail" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "loan_type" "LoanType" NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(6,3) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "monthly_payment" DECIMAL(15,2) NOT NULL,
    "loan_start_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanPayment" (
    "id" TEXT NOT NULL,
    "loanDetailId" TEXT NOT NULL,
    "payment_number" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "interest_amount" DECIMAL(15,2) NOT NULL,
    "remaining_balance" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "personId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "frequency_value" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Saving" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "personId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "frequency_value" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "target_amount" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Saving_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "loanDetailId" TEXT,
    "type" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "current_value" DECIMAL(15,2) NOT NULL,
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "annual_growth_rate" DECIMAL(6,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetInvite_token_key" ON "BudgetInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "LoanDetail_expenseId_key" ON "LoanDetail"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_loanDetailId_key" ON "Asset"("loanDetailId");

-- AddForeignKey
ALTER TABLE "BudgetInvite" ADD CONSTRAINT "BudgetInvite_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetInvite" ADD CONSTRAINT "BudgetInvite_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanDetail" ADD CONSTRAINT "LoanDetail_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanDetailId_fkey" FOREIGN KEY ("loanDetailId") REFERENCES "LoanDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saving" ADD CONSTRAINT "Saving_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saving" ADD CONSTRAINT "Saving_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saving" ADD CONSTRAINT "Saving_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_loanDetailId_fkey" FOREIGN KEY ("loanDetailId") REFERENCES "LoanDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;
