import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import compression from 'vite-plugin-compression';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export default defineConfig({
  root: '.',
  publicDir: 'public',

  plugins: [
    react(),
    tailwindcss(),

    // Pre-compress with gzip
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),

    // Pre-compress with brotli
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),

    // Rewrite the copied service worker cache name after build.
    {
      name: 'sw-cache-bust',
      apply: 'build',
      async writeBundle(options, bundle) {
        const assetNames = Object.keys(bundle).sort().join(',');
        const hash = simpleHash(assetNames);
        const outDir = options.dir || 'dist';
        const swPath = join(outDir, 'sw.js');
        try {
          const swSource = await readFile(swPath, 'utf8');
          const nextSource = swSource.replace(
            /flashcards-v[A-Za-z0-9_-]+/,
            `flashcards-v${hash}`
          );
          await writeFile(swPath, nextSource, 'utf8');
        } catch {
          // Service worker is optional during local builds.
        }
      },
    },
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    cssMinify: true,

    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    sourcemap: false,
    target: ['es2020', 'chrome80', 'safari14', 'firefox80'],
  },

  server: {
    port: 3000,
    open: true,
  },

  preview: {
    port: 4173,
  },
});

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}
