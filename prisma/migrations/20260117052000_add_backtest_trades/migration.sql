-- CreateTable
CREATE TABLE "backtest_trades" (
    "id" SERIAL NOT NULL,
    "trade_date" DATE NOT NULL,
    "trade_time" TIME NOT NULL,
    "entry" DOUBLE PRECISION NOT NULL,
    "stop_loss" DOUBLE PRECISION NOT NULL,
    "exit" DOUBLE PRECISION NOT NULL,
    "direction" TEXT NOT NULL,
    "r_value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "coin_id" INTEGER NOT NULL,
    "strategy_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" INTEGER,

    CONSTRAINT "backtest_trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backtest_trades_organization_id_strategy_id_idx" ON "backtest_trades"("organization_id", "strategy_id");

-- CreateIndex
CREATE INDEX "backtest_trades_organization_id_trade_date_idx" ON "backtest_trades"("organization_id", "trade_date");

-- CreateIndex
CREATE INDEX "backtest_trades_coin_id_idx" ON "backtest_trades"("coin_id");

-- CreateIndex
CREATE INDEX "backtest_trades_strategy_id_idx" ON "backtest_trades"("strategy_id");

-- AddForeignKey
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_coin_id_fkey" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
