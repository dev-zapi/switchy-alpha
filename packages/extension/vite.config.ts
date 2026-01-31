import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    svelte({
      emitCss: true,
    }),
    tailwindcss(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '$lib': resolve(__dirname, 'src/lib'),
      '$components': resolve(__dirname, 'src/components'),
      '@': resolve(__dirname, 'src'),
    },
    conditions: ['browser', 'import', 'module', 'default'],
  },
  base: './',
  define: {
    'import.meta.env.SSR': 'false',
  },
  build: {
    outDir: 'dist/chrome',
    target: 'esnext',
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['svelte'],
  },
});
