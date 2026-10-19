import mongoose from 'mongoose';
import { app } from './app';
import { config } from './config';

async function main() {
  mongoose.set('sanitizeFilter', true); // extra NoSQL-injection protection: $-operators in filters are treated as literals
  await mongoose.connect(config.MONGODB_URI);
  app.listen(config.PORT, () => console.log(`API listening on :${config.PORT}`));
}
main().catch((e) => {
  console.error('Startup failed:', e.message);
  process.exit(1);
});
