-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "sourceExpenseId" TEXT,
ADD COLUMN     "sourceRevenueId" TEXT;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_sourceRevenueId_fkey" FOREIGN KEY ("sourceRevenueId") REFERENCES "Revenue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_sourceExpenseId_fkey" FOREIGN KEY ("sourceExpenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
