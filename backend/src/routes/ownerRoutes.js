import { Router } from 'express'
import {
  ownerDashboard,
  ownerRatings,
} from '../controllers/dashboardController.js'
import { authenticateUser } from '../middleware/authenticate.js'
import { requireStoreOwner } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticateUser, requireStoreOwner)
router.get('/dashboard', ownerDashboard)
router.get('/ratings', ownerRatings)

export default router
