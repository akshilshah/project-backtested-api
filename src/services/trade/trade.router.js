import { Router } from 'express'
import {
  createTrade,
  listTrades,
  getTrade,
  updateTrade,
  exitTrade,
  updateExitTrade,
  previewExitTrade,
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

// Preview exit trade (must be before :id/exit to avoid conflict)
router.post('/:id/preview-exit', previewExitTrade)

// Exit trade
router.post('/:id/exit', exitTrade)

// Update exit details for closed trade
router.put('/:id/exit', updateExitTrade)

export default router
