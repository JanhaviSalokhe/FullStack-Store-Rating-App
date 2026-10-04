import { Router } from 'express'
import { listStores, searchStores } from '../controllers/storeController.js'
import { authenticateUser } from '../middleware/authenticate.js'
import { requireNormalUser } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticateUser, requireNormalUser)
router.get('/search', searchStores)
router.get('/', listStores)

export default router
