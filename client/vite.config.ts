import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } }, // dev: same-origin, so cookies just work
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: true },
});
