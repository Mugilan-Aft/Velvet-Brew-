import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Velvet Brew',
        short_name: 'Velvet Brew',
        description: 'Velvet Brew Ordering Platform',
        theme_color: '#4B2E25',
        background_color: '#FAFAFA',
        display: 'standalone'
      }
    })
  ],
})
