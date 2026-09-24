import express from 'express'

import { getProjects } from '../controllers/projectController.js'
import authenticate from '../middleware/authMiddleware.js'
import loggingMiddleware from '../middleware/loggingMiddleware.js'
import systemMiddleware from '../middleware/systemMiddleware.js'

const router = express.Router()

router.get(
  '/',
  systemMiddleware,
  authenticate,
  loggingMiddleware,
  getProjects,
)

export default router
