import { Router } from 'express'
import {
  adminDashboard,
  normalUserDashboard,
  storeOwnerDashboard,
} from '../controllers/dashboardController.js'
import { authenticateUser } from '../middleware/authenticate.js'
import {
  requireAdmin,
  requireNormalUser,
  requireStoreOwner,
} from '../middleware/requireRole.js'

const router = Router()

router.use(authenticateUser)
router.get('/admin', requireAdmin, adminDashboard)
router.get('/user', requireNormalUser, normalUserDashboard)
router.get('/store-owner', requireStoreOwner, storeOwnerDashboard)

export default router
