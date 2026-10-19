import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../lib/errors';
import { User } from '../models/User';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) throw new AppError(401, 'Authentication required');
  try {
    const p = jwt.verify(h.slice(7), config.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    req.user = { id: String(p.sub), role: p.role === 'admin' ? 'admin' : 'user' };
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
};

// Role is re-read from the database, never trusted from the client or a stale token.
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    const u = await User.findById(req.user?.id).select('role');
    if (!u || u.role !== 'admin') throw new AppError(403, 'Forbidden');
    next();
  } catch (e) {
    next(e);
  }
};
