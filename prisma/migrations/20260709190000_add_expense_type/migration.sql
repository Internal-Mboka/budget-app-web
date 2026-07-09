-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('ENTREE', 'SORTIE');

-- AlterTable
ALTER TABLE "Expense"
ADD COLUMN "type" "ExpenseType" NOT NULL DEFAULT 'SORTIE';

-- Optional: remove default if you always want API to provide type
ALTER TABLE "Expense"
ALTER COLUMN "type" DROP DEFAULT;
