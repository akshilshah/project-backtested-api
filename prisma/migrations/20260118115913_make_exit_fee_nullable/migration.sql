-- AlterTable
ALTER TABLE "trades" ALTER COLUMN "exit_fee_percentage" DROP NOT NULL,
ALTER COLUMN "exit_fee_percentage" DROP DEFAULT;
