import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config';
import { query } from './db';
import { errorHandler, notFoundHandler } from './errors';
import authRouter from './routes/auth.routes';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.CLIENT_ORIGIN === '*' ? true : config.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/health', async (_req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ data: { status: 'ok', database: 'up' } });
  } catch (error) { next(error); }
});

app.use('/api/v1/auth', authRouter);
app.use(notFoundHandler);
app.use(errorHandler);
