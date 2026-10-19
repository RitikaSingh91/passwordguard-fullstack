import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Argon2id with OWASP-recommended minimums (19 MiB, t=2, p=1).
const ARGON_OPTS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (pw: string) => argon2.hash(pw, ARGON_OPTS);
export const verifyPassword = (hash: string, pw: string) => argon2.verify(hash, pw);

// Used when the email is unknown so login timing does not reveal which accounts exist.
let dummy: Promise<string> | undefined;
export const dummyHash = () => (dummy ??= hashPassword('not-a-real-password-for-timing'));

export const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
export const randomToken = () => crypto.randomBytes(48).toString('base64url');

export const signAccessToken = (userId: string, role: string) =>
  jwt.sign({ role }, config.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: config.ACCESS_TTL as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
