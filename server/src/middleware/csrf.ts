import { RequestHandler } from 'express';
import { config } from '../config';
import { AppError } from '../lib/errors';

// Cookie-authenticated endpoints (refresh/logout) are CSRF targets. HttpOnly does not stop CSRF, so we
// (1) verify the Origin header matches our client and (2) require a custom header that a plain
// cross-site HTML form cannot send. Combined with SameSite cookies this gives defence in depth.
export const csrfGuard: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== config.CLIENT_ORIGIN) throw new AppError(403, 'Origin not allowed');
  if (req.headers['x-requested-with'] !== 'PasswordGuard') throw new AppError(403, 'Missing CSRF header');
  next();
};
