import mongoose from 'mongoose';
import { config } from '../src/config';
import { hashPassword } from '../src/lib/security';
import { User } from '../src/models/User';

// Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then `npm run seed:admin`.
(async () => {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars)');
  await mongoose.connect(config.MONGODB_URI);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log('Existing user promoted to admin:', email);
  } else {
    await User.create({ name: 'Admin', email, role: 'admin', passwordHash: await hashPassword(password) });
    console.log('Admin created:', email);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
