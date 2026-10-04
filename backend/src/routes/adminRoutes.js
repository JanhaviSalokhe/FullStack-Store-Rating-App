import { Router } from 'express'
import {
  addStore,
  addUser,
  adminDashboard,
  getStores,
  getUserDetails,
  getUsers,
} from '../controllers/adminController.js'
import { authenticateUser } from '../middleware/authenticate.js'
import { requireAdmin } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticateUser, requireAdmin)
router.get('/dashboard', adminDashboard)
router.post('/users', addUser)
router.get('/users/:id', getUserDetails)
router.get('/users', getUsers)
router.post('/stores', addStore)
router.get('/stores', getStores)

export default router
