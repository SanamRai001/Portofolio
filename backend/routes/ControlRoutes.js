import express  from 'express'
import { controlController } from '../controllers/controlController.js';

const router  = express.Router();

router.get('/',controlController);

export default  router;