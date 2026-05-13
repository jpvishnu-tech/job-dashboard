import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * In development, Vite proxies every request starting with /api to the
 * Express backend running on port 5000.  This means:
 *   • No CORS issues during development (same origin from the browser's perspective)
 *   • api.js can use relative paths: fetch('/api/auth/login') just works
 *   • In production, set VITE_API_URL to your backend's public URL instead
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target:      'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          vendor:   ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
