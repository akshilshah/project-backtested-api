import { Router } from 'express'
import {
  createTrade,
  listTrades,
  getTrade,
  updateTrade,
  exitTrade,
  deleteTrade,
  getAnalytics
} from './trade.controller'

const router = Router()

// Analytics endpoint (must be before :id routes to avoid conflict)
router.get('/analytics', getAnalytics)

// CRUD operations
router.post('/', createTrade)
router.get('/', listTrades)
router.get('/:id', getTrade)
router.put('/:id', updateTrade)
router.delete('/:id', deleteTrade)

// Exit trade
router.post('/:id/exit', exitTrade)

export default router
