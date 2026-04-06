import express from 'express';
import { getProjects } from '../controllers/projectController.js';
import systemMiddleware from '../middleware/systemMiddleware.js';
import rateLimitMiddleware from '../middleware/rateLimitMiddleware.js';
import loggingMiddleware from '../middleware/loggingMiddleware.js';
import  authenticate from '../middleware/authMiddleware.js'
const router = express.Router();

router.get('/', systemMiddleware, authenticate, loggingMiddleware,getProjects);

export default router;
