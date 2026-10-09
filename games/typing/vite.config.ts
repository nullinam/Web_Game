import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const fontCache = (urlPattern: RegExp, cacheName: string) => ({
  urlPattern,
  handler: 'CacheFirst' as const,
  options: {
    cacheName,
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 365
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
});

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'app.html')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['penko-typing-icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Typing Game',
        short_name: 'Typing',
        description: 'English typing practice with live speed feedback and accuracy tracking.',
        theme_color: '#20120b',
        background_color: '#100d10',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        categories: ['education', 'games'],
        icons: [
          { src: './penko-typing-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: './icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff2}'],
        runtimeCaching: [
          fontCache(/^https:\/\/fonts\.googleapis\.com\/.*/i, 'google-fonts-cache'),
          fontCache(/^https:\/\/fonts\.gstatic\.com\/.*/i, 'gstatic-fonts-cache')
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
