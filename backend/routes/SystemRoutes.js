import express from 'express'
import { updateSystemConfig } from '../controllers/systemController.js';

const router= express.Router();

router.post('/system', updateSystemConfig )

export default router;