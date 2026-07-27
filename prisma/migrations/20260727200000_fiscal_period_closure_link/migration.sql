-- AlterTable
ALTER TABLE "FinancialPeriodClosure" ADD COLUMN "fiscalPeriodId" TEXT;
ALTER TABLE "FinancialPeriodClosure" ADD COLUMN "receivableOutstandingTotal" DECIMAL(12,2);
ALTER TABLE "FinancialPeriodClosure" ADD COLUMN "receivableCount" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriodClosure_fiscalPeriodId_key" ON "FinancialPeriodClosure"("fiscalPeriodId");

-- AddForeignKey
ALTER TABLE "FinancialPeriodClosure" ADD CONSTRAINT "FinancialPeriodClosure_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
