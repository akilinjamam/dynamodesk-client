import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5174 / API 4000 deliberately avoid the POS stack's 5173 / 5000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
