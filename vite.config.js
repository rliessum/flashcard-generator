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
    strictPort: true,

    // HMR (Hot Module Replacement) configuration.
    // We use a dedicated WebSocket port (24678) because running both HTTP + HMR
    // on port 3000 frequently causes connection failures behind proxies, VPNs,
    // corporate networks, or certain macOS / firewall configurations.
    hmr: {
      port: 24678,        // Dedicated HMR WebSocket port (separate from the HTTP dev server)
      host: 'localhost',  // Explicit host reduces "localhost vs 127.0.0.1" mismatches
      overlay: true,      // Show a nice full-screen error overlay on compile/runtime errors
      // protocol: 'ws',  // Force unencrypted WS only if you have SSL termination issues
    },

    // Helps with some corporate proxy / CORS scenarios during development
    cors: true,

    // File watching options — can be tuned if you experience slow or missed HMR updates
    watch: {
      usePolling: false, // Set to true only if you're on a network filesystem (e.g. Docker on macOS)
      interval: 100,
    },
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
