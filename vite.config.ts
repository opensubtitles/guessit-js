import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GuessItJS',
      fileName: 'guessit-js',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // No external deps — fully self-contained for WASM compatibility
      external: [],
    },
    target: 'es2020',
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
