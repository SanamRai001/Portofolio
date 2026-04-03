import express from 'express';
import { getProjects } from '../controllers/projectController.js';
import dbMiddleware from '../middleware/dbMiddleware.js';

const router = express.Router();

router.get('/', dbMiddleware,getProjects);
// router.get('/', getProjects);

export default router;