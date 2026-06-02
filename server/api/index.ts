import '../src/config/env';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../src/middleware/errorHandler';
import authRoutes from '../src/routes/auth';
import profileRoutes from '../src/routes/profile';
import twinRoutes from '../src/routes/twin';
import simulationRoutes from '../src/routes/simulation';
import coachRoutes from '../src/routes/coach';
import dreamsRoutes from '../src/routes/dreams';

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL ?? 'http://localhost:5174',
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(null, allowed);
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/twin', twinRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/dreams', dreamsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
