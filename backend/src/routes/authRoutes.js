import { Router } from 'express'
import {
  changePassword,
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/authController.js'
import authenticate from '../middleware/authenticate.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, getCurrentUser)
router.patch('/password', authenticate, changePassword)

export default router
