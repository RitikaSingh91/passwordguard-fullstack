import { Router } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { z } from 'zod';
import { wrap } from '../lib/async';
import { AppError } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { Analysis, CATEGORIES } from '../models/Analysis';

export const analysesRouter = Router();
analysesRouter.use(requireAuth);

// .strict() means a body containing e.g. "password" is rejected, so it cannot be saved by accident.
const createSchema = z.object({
  label: z.string().trim().max(80).optional(),
  score: z.number().min(0).max(100),
  category: z.enum(CATEGORIES),
  guessesLog10: z.number().min(0).max(400),
  length: z.number().int().min(0).max(1024),
  patterns: z.array(z.string().trim().max(60)).max(20).default([]),
  breachChecked: z.boolean().default(false),
  breached: z.boolean().nullable().default(null),
}).strict();

const listSchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

analysesRouter.post('/', wrap(async (req, res) => {
  const body = createSchema.parse(req.body);
  const doc = await Analysis.create({ ...body, user: req.user!.id }); // user from token, never the body
  res.status(201).json({ analysis: doc });
}));

analysesRouter.get('/', wrap(async (req, res) => {
  const { q, category, page, limit } = listSchema.parse(req.query);
  const filter: Record<string, unknown> = { user: new Types.ObjectId(req.user!.id) };
  if (category) filter.category = category;
  if (q) filter.label = { $regex: escapeRegex(q), $options: 'i' };
  const [items, total] = await Promise.all([
    Analysis.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Analysis.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

analysesRouter.get('/stats', wrap(async (req, res) => {
  const uid = new Types.ObjectId(req.user!.id);
  const [byCategory, totals] = await Promise.all([
    Analysis.aggregate([{ $match: { user: uid } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Analysis.aggregate([{ $match: { user: uid } }, { $group: { _id: null, total: { $sum: 1 }, avgScore: { $avg: '$score' } } }]),
  ]);
  res.json({
    total: totals[0]?.total ?? 0,
    avgScore: Math.round(totals[0]?.avgScore ?? 0),
    byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
  });
}));

analysesRouter.delete('/:id', wrap(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid id');
  const r = await Analysis.deleteOne({ _id: req.params.id, user: req.user!.id }); // ownership enforced in query
  if (!r.deletedCount) throw new AppError(404, 'Not found');
  res.status(204).end();
}));

analysesRouter.delete('/', wrap(async (req, res) => {
  const r = await Analysis.deleteMany({ user: req.user!.id });
  res.json({ deleted: r.deletedCount });
}));
