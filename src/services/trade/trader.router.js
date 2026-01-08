import { Router } from 'express'
import {
  conflict,
  created,
  error,
  ok,
  unauthorized
} from '../utils/express-helper'

const router = Router()
router.use(created, error, unauthorized, ok, conflict)

export default router
