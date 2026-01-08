import { Router } from 'express'
import {
  createStrategy,
  listStrategies,
  getStrategy,
  updateStrategy,
  deleteStrategy
} from './strategies.controller'

const router = Router()

router.post('/', createStrategy)
router.get('/', listStrategies)
router.get('/:id', getStrategy)
router.put('/:id', updateStrategy)
router.delete('/:id', deleteStrategy)

export default router
