// vite.config.mjs — point d'entrée unique du build (remplace react-scripts / Create React App)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const src = sub => fileURLToPath(new URL(`./src/${sub}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': src(''),
      '@components': src('components'),
      '@contexts': src('contexts'),
      '@services': src('services'),
      '@utils': src('utils'),
      '@hooks': src('hooks'),
      // L'alias '@types' a été retiré : il entrait en conflit avec le scope npm @types/*
    },
  },
  server: {
    port: 3000,
    proxy: {
      // 127.0.0.1 plutôt que localhost : sous Windows, localhost peut viser ::1 (IPv6) où uvicorn n'écoute pas
      '/api': {
        target: process.env.OMUSIKI_API_TARGET || 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  // vite preview reprend le même proxy (build testé de bout en bout avec le back-end local)
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: process.env.OMUSIKI_API_TARGET || 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
