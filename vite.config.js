import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 相對路徑：build 出來的 dist/ 放到任何子路徑（例如 GitHub Pages）都能開
  base: './',
  plugins: [vue()],
  build: {
    // three.js 本身就約 550 kB，單獨切一包，也不要再跳體積警告
    chunkSizeWarningLimit: 800,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
