import express from 'express';
import { getProjects } from '../controllers/projectController.js';
import systemMiddleware from '../middleware/systemMiddleware.js';
import rateLimitMiddleware from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.get('/', systemMiddleware, rateLimitMiddleware,getProjects);

export default router;