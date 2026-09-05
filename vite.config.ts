import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages sert le site sous /<nom-du-depot>/. Surchargeable via VITE_BASE
// (ex. VITE_BASE=/ pour un domaine personnalisé ou un déploiement à la racine).
const base = process.env.VITE_BASE ?? '/Bikeapp/'

export default defineConfig({
  base,
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' : on prévient l’utilisateur qu’une mise à jour existe au lieu
      // de recharger la page sous ses doigts pendant une sortie vélo.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Bikeapp',
        short_name: 'Bikeapp',
        description: 'Application vélo personnelle',
        lang: 'fr',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        categories: ['sports', 'health', 'travel'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      // Permet de tester le service worker avec `npm run dev`.
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
})
