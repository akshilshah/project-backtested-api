-- AlterTable
ALTER TABLE "strategies" ADD COLUMN     "entry_rule" TEXT,
ADD COLUMN     "exit_rule" TEXT,
ADD COLUMN     "stop_loss_rule" TEXT;
