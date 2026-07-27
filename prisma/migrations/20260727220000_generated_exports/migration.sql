-- CreateEnum
CREATE TYPE "GeneratedExportKind" AS ENUM ('FINANCIAL_CSV', 'EXPENSE_RECAP_PDF', 'PERIOD_BALANCE_PDF', 'FISCAL_PERIOD_BALANCE_PDF');

-- CreateTable
CREATE TABLE "GeneratedExport" (
    "id" TEXT NOT NULL,
    "kind" "GeneratedExportKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "generatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedExport_createdAt_idx" ON "GeneratedExport"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedExport_kind_idx" ON "GeneratedExport"("kind");

-- CreateIndex
CREATE INDEX "GeneratedExport_generatedByUserId_idx" ON "GeneratedExport"("generatedByUserId");

-- AddForeignKey
ALTER TABLE "GeneratedExport" ADD CONSTRAINT "GeneratedExport_generatedByUserId_fkey" FOREIGN KEY ("generatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
