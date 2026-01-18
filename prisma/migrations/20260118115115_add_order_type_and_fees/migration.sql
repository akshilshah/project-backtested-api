-- AlterTable
ALTER TABLE "trades" ADD COLUMN     "entry_fee_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
ADD COLUMN     "entry_order_type" TEXT NOT NULL DEFAULT 'LIMIT',
ADD COLUMN     "exit_fee_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0.05;
