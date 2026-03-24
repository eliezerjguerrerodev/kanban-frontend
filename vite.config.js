import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://kanban-backend.test',
        changeOrigin: true,
        headers: { Accept: 'application/json' }
      },
      '/login': {
        target: 'http://kanban-backend.test',
        changeOrigin: true,
        headers: { Accept: 'application/json' }
      },
      '/register': {
        target: 'http://kanban-backend.test',
        changeOrigin: true,
        headers: { Accept: 'application/json' }
      },
      '/logout': {
        target: 'http://kanban-backend.test',
        changeOrigin: true,
        headers: { Accept: 'application/json' }
      },
      '/sanctum/csrf-cookie': {
        target: 'http://kanban-backend.test',
        changeOrigin: true,
        headers: { Accept: 'application/json' }
      }
    }
  }
})
