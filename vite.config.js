import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import compression from 'vite-plugin-compression';

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

    // Copy service worker and handle cache busting
    {
      name: 'sw-cache-bust',
      generateBundle(_, bundle) {
        const assetNames = Object.keys(bundle).sort().join(',');
        const hash = simpleHash(assetNames);
        const swContent = bundle['sw.js'];
        if (swContent && swContent.type === 'asset') {
          const src = typeof swContent.source === 'string'
            ? swContent.source
            : new TextDecoder().decode(swContent.source);
          swContent.source = src.replace(
            /flashcards-v\d+/,
            `flashcards-v${hash}`
          );
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
