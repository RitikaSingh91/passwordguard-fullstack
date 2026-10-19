import { Request, Response, Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { config, isProd } from '../config';
import { wrap } from '../lib/async';
import { AppError } from '../lib/errors';
import { dummyHash, hashPassword, randomToken, sha256, signAccessToken, verifyPassword } from '../lib/security';
import { sendResetEmail } from '../lib/mailer';
import { csrfGuard } from '../middleware/csrf';
import { requireAuth } from '../middleware/auth';
import { RefreshToken } from '../models/RefreshToken';
import { ResetToken } from '../models/ResetToken';
import { User } from '../models/User';

export const authRouter = Router();
const COOKIE = 'pg_rt';
const cookieOpts = {
  httpOnly: true,
  secure: isProd, // HTTPS only in production
  sameSite: config.COOKIE_SAMESITE,
  path: '/api/auth',
  maxAge: config.REFRESH_DAYS * 86_400_000,
} as const;

// Strict schemas: string-only fields reject NoSQL operator objects like {"$gt": ""}.
const email = z.string().trim().toLowerCase().email().max(254);
const accountPassword = z.string().min(12, 'At least 12 characters').max(128);
const registerSchema = z.object({ name: z.string().trim().min(2).max(60), email, password: accountPassword }).strict();
const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
const forgotSchema = z.object({ email }).strict();
const resetSchema = z.object({ token: z.string().min(20).max(200), password: accountPassword }).strict();

async function issueSession(res: Response, user: { id?: string; role: string; name: string; email: string }, family?: string) {
  const raw = randomToken();
  await RefreshToken.create({
    user: user.id as string,
    tokenHash: sha256(raw),
    family: family ?? crypto.randomUUID(),
    expiresAt: new Date(Date.now() + config.REFRESH_DAYS * 86_400_000),
  });
  res.cookie(COOKIE, raw, cookieOpts);
  return {
    accessToken: signAccessToken(user.id as string, user.role),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

authRouter.post('/register', wrap(async (req, res) => {
  const body = registerSchema.parse(req.body);
  try {
    const user = await User.create({ name: body.name, email: body.email, passwordHash: await hashPassword(body.password) });
    res.status(201).json(await issueSession(res, user));
  } catch (e: any) {
    if (e?.code === 11000) throw new AppError(409, 'An account with this email already exists');
    throw e;
  }
}));

authRouter.post('/login', wrap(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email }).select('+passwordHash');
  const ok = await verifyPassword(user?.passwordHash ?? (await dummyHash()), body.password).catch(() => false);
  if (!user || !ok) throw new AppError(401, 'Invalid email or password'); // generic on purpose
  res.json(await issueSession(res, user));
}));

// Rotation: every refresh revokes the old token and issues a new one in the same family.
// Presenting an already-revoked token means theft is likely, so the whole family is revoked.
authRouter.post('/refresh', csrfGuard, wrap(async (req: Request, res: Response) => {
  const raw = req.cookies?.[COOKIE];
  if (typeof raw !== 'string') throw new AppError(401, 'No session');
  const doc = await RefreshToken.findOne({ tokenHash: sha256(raw) });
  if (!doc) throw new AppError(401, 'Invalid session');
  if (doc.revokedAt) {
    await RefreshToken.updateMany({ family: doc.family, revokedAt: null }, { revokedAt: new Date() });
    res.clearCookie(COOKIE, { ...cookieOpts, maxAge: undefined });
    throw new AppError(401, 'Session revoked');
  }
  if (doc.expiresAt < new Date()) throw new AppError(401, 'Session expired');
  doc.revokedAt = new Date();
  await doc.save();
  const user = await User.findById(doc.user);
  if (!user) throw new AppError(401, 'Invalid session');
  res.json(await issueSession(res, user, doc.family));
}));

authRouter.post('/logout', csrfGuard, wrap(async (req, res) => {
  const raw = req.cookies?.[COOKIE];
  if (typeof raw === 'string') await RefreshToken.updateOne({ tokenHash: sha256(raw), revokedAt: null }, { revokedAt: new Date() });
  res.clearCookie(COOKIE, { ...cookieOpts, maxAge: undefined });
  res.status(204).end();
}));

authRouter.get('/me', requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(401, 'Invalid session');
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

// Always the same response, whether or not the account exists.
authRouter.post('/forgot-password', wrap(async (req, res) => {
  const { email: addr } = forgotSchema.parse(req.body);
  const user = await User.findOne({ email: addr });
  if (user) {
    const raw = randomToken();
    await ResetToken.create({ user: user.id, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + 30 * 60_000) });
    await sendResetEmail(addr, `${config.CLIENT_ORIGIN}/reset-password?token=${raw}`).catch(() => undefined);
  }
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
}));

authRouter.post('/reset-password', wrap(async (req, res) => {
  const body = resetSchema.parse(req.body);
  const doc = await ResetToken.findOne({ tokenHash: sha256(body.token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!doc) throw new AppError(400, 'Reset link is invalid or has expired');
  doc.usedAt = new Date();
  await doc.save();
  await User.updateOne({ _id: doc.user }, { passwordHash: await hashPassword(body.password) });
  await RefreshToken.updateMany({ user: doc.user, revokedAt: null }, { revokedAt: new Date() }); // sign out everywhere
  res.json({ message: 'Password updated. Please sign in.' });
}));
