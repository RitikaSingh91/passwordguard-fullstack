import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/pg-test',
      JWT_ACCESS_SECRET: 'x'.repeat(40),
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
  },
});
