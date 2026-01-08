import { Router } from 'express'
import {
  createCoin,
  listCoins,
  getCoin,
  updateCoin,
  deleteCoin
} from './coins.controller'

const router = Router()

router.post('/', createCoin)
router.get('/', listCoins)
router.get('/:id', getCoin)
router.put('/:id', updateCoin)
router.delete('/:id', deleteCoin)

export default router
