import { defineConfig } from 'vitest/config';
import { ignoreUnchangedFiles } from './tools/vite/ignoreUnchanged.ts';

export default defineConfig({
  plugins: [ignoreUnchangedFiles()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
