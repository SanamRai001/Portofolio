import express from 'express'
import { verifyUser } from '../controllers/authController.js';
import systemMiddleware from '../middleware/systemMiddleware.js';

const router = express.Router();

router.post('/login', systemMiddleware, verifyUser);

export default router;