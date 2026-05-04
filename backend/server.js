import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

import projectRoutes from './routes/projectRoutes.js'
import authRoutes from './routes/AuthRoutes.js'
import systemRoutes from './routes/SystemRoutes.js'
import controlRoutes from './routes/ControlRoutes.js'
import logRoutes from './routes/LogRoutes.js'

//middleware
import loggingMiddleware from './middleware/loggingMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://sanam-rai.com.np' }));
app.use(express.json());
app.use(express.static('public'));
// app.use(loggingMiddleware);


app.use("/api/projects", projectRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/', systemRoutes);
app.use('/api/controls', controlRoutes);
app.use('/api/logs', logRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!');
});
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}).catch(() => process.exit(1));