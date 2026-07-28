-- CreateEnum
CREATE TYPE "FiscalPeriodStatus" AS ENUM ('PENDING_SETUP', 'OPEN', 'CLOSING', 'CLOSED');

-- CreateTable
CREATE TABLE "FiscalPeriod" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "FiscalPeriodStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "closedAt" TIMESTAMP(3),
    "openingBalanceCash" DECIMAL(12,2),
    "openingBalanceMobile" DECIMAL(12,2),
    "openingBalanceBank" DECIMAL(12,2),
    "skipOpeningBalance" BOOLEAN NOT NULL DEFAULT false,
    "validatedByPdgId" TEXT,
    "validatedByAccountantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalPeriod_status_idx" ON "FiscalPeriod"("status");

-- CreateIndex
CREATE INDEX "FiscalPeriod_startDate_endDate_idx" ON "FiscalPeriod"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_validatedByPdgId_fkey" FOREIGN KEY ("validatedByPdgId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_validatedByAccountantId_fkey" FOREIGN KEY ("validatedByAccountantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
