import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Use subdirectory base only for production builds (GitHub Pages)
  // Use root path for local development
  base: command === 'build' ? '/meck-county-zoning-map/' : '/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser'
  },
  server: {
    port: 3000,
    open: true
  }
}));
