import { Router } from 'express'
import coinsRouter from './coins/router'
import strategiesRouter from './strategies/router'

const router = Router()

router.use('/coins', coinsRouter)
router.use('/strategies', strategiesRouter)

export default router
