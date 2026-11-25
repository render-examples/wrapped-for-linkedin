import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tests import fixtures/all-badges.xlsx with `?inline`.
  assetsInclude: ['**/*.xlsx'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types/index.ts'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@exports': path.resolve(__dirname, './src/exports'),
    },
  },
});
