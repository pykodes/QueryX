import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind to all interfaces so other devices on the LAN can access the frontend
    // e.g. http://192.168.29.170:5173
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Proxy stays pointing to localhost backend running on the same machine
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ask': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/database-test': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/employees-test': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

