import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/php': {
        target: 'http://mondaytalks',
        changeOrigin: true,
      },
      '/php/api': {
        target: 'http://mondaytalks/php',
        changeOrigin: true,
      }
    }
  }
})