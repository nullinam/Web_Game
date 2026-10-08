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
        name: 'Typing Speed',
        short_name: 'Typing',
        description: 'Typing practice with keyboard layouts, live speed feedback and accuracy tracking.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
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
