import express from 'express'
import { getLogs } from '../utils/logStore.js';

const router  = express.Router();

router.get('/', (req, res)=>{
    res.json({
        success: true,
        message: "Logs fetched  successfully",
        data: getLogs()
    })
});

export default router;