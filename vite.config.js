import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom domain (notes.xiaomi388.com) served at root → base '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
