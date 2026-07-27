-- CreateTable
CREATE TABLE "FinancialPeriodClosure" (
    "id" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "documentCode" TEXT NOT NULL,
    "revenueTotal" DECIMAL(12,2) NOT NULL,
    "expenseTotal" DECIMAL(12,2) NOT NULL,
    "creditTotal" DECIMAL(12,2) NOT NULL,
    "netBalance" DECIMAL(12,2) NOT NULL,
    "paidRevenueTotal" DECIMAL(12,2) NOT NULL,
    "paidExpenseTotal" DECIMAL(12,2) NOT NULL,
    "netCashFlow" DECIMAL(12,2) NOT NULL,
    "revenueCount" INTEGER NOT NULL,
    "expenseCount" INTEGER NOT NULL,
    "creditCount" INTEGER NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialPeriodClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriodClosure_periodKey_key" ON "FinancialPeriodClosure"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriodClosure_documentCode_key" ON "FinancialPeriodClosure"("documentCode");

-- CreateIndex
CREATE INDEX "FinancialPeriodClosure_startDate_endDate_idx" ON "FinancialPeriodClosure"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "FinancialPeriodClosure_closedAt_idx" ON "FinancialPeriodClosure"("closedAt");

-- AddForeignKey
ALTER TABLE "FinancialPeriodClosure" ADD CONSTRAINT "FinancialPeriodClosure_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
