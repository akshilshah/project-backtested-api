/*
  Warnings:

  - Added the required column `amount` to the `trades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stop_loss_percentage` to the `trades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add columns as nullable first
ALTER TABLE "trades" ADD COLUMN "amount" DOUBLE PRECISION,
ADD COLUMN "stop_loss_percentage" DOUBLE PRECISION;

-- Set default values for existing records
-- Set stop_loss_percentage to 1.8 (the previous hardcoded value)
-- Set amount to a default value (trade value / 0.018 to reverse calculate, or use trade value as fallback)
UPDATE "trades"
SET "stop_loss_percentage" = 1.8,
    "amount" = CASE
      WHEN quantity * avg_entry > 0 THEN quantity * avg_entry / 0.018
      ELSE 10000.0  -- fallback default amount
    END
WHERE "stop_loss_percentage" IS NULL OR "amount" IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE "trades" ALTER COLUMN "amount" SET NOT NULL;
ALTER TABLE "trades" ALTER COLUMN "stop_loss_percentage" SET NOT NULL;
