import { Router } from 'express';
import { wrap } from '../lib/async';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { Analysis } from '../models/Analysis';
import { User } from '../models/User';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

// Aggregate, anonymous analytics only. No per-user passwords exist to expose.
adminRouter.get('/stats', wrap(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [users, analyses, byCategory, daily, breach] = await Promise.all([
    User.countDocuments(),
    Analysis.countDocuments(),
    Analysis.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Analysis.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Analysis.aggregate([
      { $match: { breachChecked: true } },
      { $group: { _id: '$breached', count: { $sum: 1 } } },
    ]),
  ]);
  res.json({
    users,
    analyses,
    byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
    daily: daily.map((d) => ({ date: d._id, count: d.count })),
    breachChecks: breach.map((b) => ({ breached: b._id, count: b.count })),
  });
}));

adminRouter.get('/users', wrap(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(100).select('name email role createdAt');
  res.json({ users });
}));
