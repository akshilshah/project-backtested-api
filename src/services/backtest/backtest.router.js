import { Router } from 'express'
import {
  createBacktestTrade,
  listBacktestTrades,
  getBacktestTrade,
  updateBacktestTrade,
  deleteBacktestTrade,
  getStrategyAnalytics
} from './backtest.controller'

const router = Router()

// Analytics endpoint (must be before :id routes to avoid conflict)
router.get('/analytics/:strategyId', getStrategyAnalytics)

// CRUD operations
router.post('/', createBacktestTrade)
router.get('/', listBacktestTrades)
router.get('/:id', getBacktestTrade)
router.put('/:id', updateBacktestTrade)
router.delete('/:id', deleteBacktestTrade)

export default router
