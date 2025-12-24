import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    // Enable history API fallback for SPA routing
    // This ensures that refreshing any route works correctly
  },
  preview: {
    // For production preview, ensure SPA routing works
    port: 3000,
  },
})

