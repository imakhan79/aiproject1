import './config/env';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import twinRoutes from './routes/twin';
import simulationRoutes from './routes/simulation';
import coachRoutes from './routes/coach';
import dreamsRoutes from './routes/dreams';

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/twin', twinRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/dreams', dreamsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const port = parseInt(env.PORT, 10);
app.listen(port, () => {
  console.log(`NeuroVerse API running on http://localhost:${port}`);
});
