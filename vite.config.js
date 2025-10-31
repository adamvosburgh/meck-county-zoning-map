import { defineConfig } from 'vite';

export default defineConfig({
  base: '/meck-county-zoning-map/',
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
});
