import { Router } from 'express'
import {
  modifyRating,
  submitRating,
} from '../controllers/ratingController.js'
import { authenticateUser } from '../middleware/authenticate.js'
import { requireNormalUser } from '../middleware/requireRole.js'

const router = Router()

router.use(authenticateUser, requireNormalUser)
router.post('/', submitRating)
router.put('/:id', modifyRating)

export default router
