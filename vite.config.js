import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/nhl-api': {
        target: 'https://api-web.nhle.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nhl-api/, '')
      }
    }
  }
})
