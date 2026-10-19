import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, isProd } from './config';
import { errorHandler, notFound } from './middleware/errors';
import { adminRouter } from './routes/admin';
import { analysesRouter } from './routes/analyses';
import { authRouter } from './routes/auth';

export const app = express();
app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1); // Render/Railway sit behind a proxy

app.use(helmet());
app.use(cors({ origin: [config.CLIENT_ORIGIN], credentials: true, methods: ['GET', 'POST', 'DELETE'] }));
app.use(express.json({ limit: '10kb' })); // request-size limit
app.use(cookieParser());

// Safe request log: method, path (no query string), status. Never bodies or headers.
app.use((req, res, next) => {
  res.on('finish', () => config.NODE_ENV !== 'test' && console.log(req.method, req.path, res.statusCode));
  next();
});

app.use(rateLimit({ windowMs: 15 * 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/analyses', analysesRouter);
app.use('/api/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);
