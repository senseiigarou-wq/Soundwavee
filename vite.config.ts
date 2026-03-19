import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      ...(isProd ? [
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          includeAssets: [
            'favicon.ico', 'favicon.svg',
            'favicon-16x16.png', 'favicon-32x32.png',
            'apple-touch-icon.png',
            'android-chrome-192x192.png',
            'android-chrome-512x512.png',
          ],
          manifest: {
            name: 'Soundwave',
            short_name: 'Soundwave',
            description: 'Your personal music streaming player powered by YouTube',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            orientation: 'any',
            background_color: '#000000',
            theme_color: '#7ed0ec',
            categories: ['music', 'entertainment'],
            icons: [
              { src: '/favicon-16x16.png',         sizes: '16x16',   type: 'image/png' },
              { src: '/favicon-32x32.png',          sizes: '32x32',   type: 'image/png' },
              { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
              { src: '/icon-192-maskable.png',       sizes: '192x192', type: 'image/png', purpose: 'maskable' },
              { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
              { src: '/icon-512-maskable.png',       sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/i\.ytimg\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'yt-thumbnails',
                  expiration: { maxEntries: 200, maxAgeSeconds: 604800 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'google-fonts-stylesheets' },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
                handler: 'NetworkFirst',
                options: { cacheName: 'firebase', networkTimeoutSeconds: 10 },
              },
            ],
            navigateFallbackDenylist: [/^\/(__\/auth|api)\//, /^\/ads\.txt$/, /^\/robots\.txt$/, /^\/site\.webmanifest$/],
          },
        }),
      ] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      postcss: './tailwind.config.js',
    },
    build: {
      // Content-hashed filenames — browsers always fetch the latest
      // JS/CSS after a deploy without needing a manual cache clear.
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      // Suppress large-chunk warnings (Firebase + React = big bundles)
      chunkSizeWarningLimit: 1000,
    },
  };
});
