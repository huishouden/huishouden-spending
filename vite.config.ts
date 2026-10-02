import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { pwaApp } from '@piekstra/pwa-kit/vite';

const googleFontsCache = (urlPattern: RegExp, cacheName: string) => ({
  urlPattern,
  handler: 'CacheFirst' as const,
  options: {
    cacheName,
    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
    cacheableResponse: { statuses: [0, 200] },
  },
});

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      pwaApp({
        name: 'Household Card Spend Display',
        shortName: 'Card Spend',
        description: 'Ambient household credit card spending & category tracker for Pixel Tablet & Google Sheets.',
        themeColor: '#0f172a',
        backgroundColor: '#020617',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        includeAssets: ['icon.svg', 'favicon.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        overrides: {
          manifest: { categories: ['finance', 'productivity', 'utilities'] },
          workbox: {
            runtimeCaching: [
              googleFontsCache(/^https:\/\/fonts\.googleapis\.com\/.*/i, 'google-fonts-cache'),
              googleFontsCache(/^https:\/\/fonts\.gstatic\.com\/.*/i, 'gstatic-fonts-cache'),
            ],
          },
          devOptions: { enabled: true, type: 'module' },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
  };
});
