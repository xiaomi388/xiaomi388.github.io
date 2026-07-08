import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom domain (blog.xiaomi388.com) served at root → base '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
