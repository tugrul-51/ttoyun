import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2018',
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 12000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo?.name || '';
          if (name.endsWith('.css')) return 'assets/index.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
