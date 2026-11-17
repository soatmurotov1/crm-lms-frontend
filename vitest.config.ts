import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // The full suite (~185 files) runs in parallel workers; heavy dialog/page
    // tests that pass in ~1s alone can exceed the 5s default under load.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'scripts/**/*.{test,spec}.{ts,tsx}',
    ],
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
});
