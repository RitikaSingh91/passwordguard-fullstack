import 'dotenv/config';
import { z } from 'zod';

// Fail fast at startup if any secret/config is missing or weak.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  CLIENT_ORIGIN: z.string().url(),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
});

export const config = schema.parse(process.env);
export const isProd = config.NODE_ENV === 'production';
