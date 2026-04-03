import express from 'express';
import { getProjects } from '../controllers/projectController.js';
import systemMiddleware from '../middleware/systemMiddleware.js';

const router = express.Router();

router.get('/', systemMiddleware,getProjects);

export default router;