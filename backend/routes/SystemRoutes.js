import express from 'express'
import { readSystemConfig, updateSystemConfig } from '../controllers/systemController.js';

const router= express.Router();

router.post('/system', updateSystemConfig );
router.get('/system', readSystemConfig);
export default router;