import { Router } from 'express'
import {
  conflict,
  created,
  error,
  ok,
  unauthorized
} from '../../utils/express-helper'
import {
  createTrade,
  listTrades,
  getTrade,
  updateTrade,
  exitTrade,
  deleteTrade,
  getAnalytics
} from './controller'

const router = Router()
router.use(created, error, unauthorized, ok, conflict)

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
