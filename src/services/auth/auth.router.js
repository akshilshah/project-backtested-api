import { Router } from 'express'
import {
  signup,
  login,
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  protect
} from './auth.controller'

const router = Router()

// Public routes
router.post('/signup', signup)
router.post('/login', login)

// Protected routes
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.get('/settings', protect, getSettings)
router.put('/settings', protect, updateSettings)

export default router
