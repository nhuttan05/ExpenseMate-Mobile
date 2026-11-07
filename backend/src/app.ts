import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config';
import { query } from './db';
import { errorHandler, notFoundHandler } from './errors';
import authRouter from './routes/auth.routes';
import transactionsRouter from './routes/transactions.routes';
import categoriesRouter from './routes/categories.routes';
import budgetsRouter from './routes/budgets.routes';
import notificationsRouter from './routes/notifications.routes';
import analyticsRouter from './routes/analytics.routes';
import { requireAuth } from './middleware/auth.middleware';
import { syncTransactionsHandler } from './routes/transactions.routes';
import walletsRouter from './routes/wallets.routes';
import recurringRouter from './routes/recurring.routes';
import planningRouter from './routes/planning.routes';

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
app.use('/api/v1/transactions', transactionsRouter);
const syncRouter = express.Router();
syncRouter.use(requireAuth);
syncRouter.post('/transactions', syncTransactionsHandler);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/budgets', budgetsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/wallets', walletsRouter);
app.use('/api/v1/recurring', recurringRouter);
app.use('/api/v1', planningRouter);
app.use(notFoundHandler);
app.use(errorHandler);
