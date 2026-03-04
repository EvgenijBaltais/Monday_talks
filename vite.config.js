import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/register_user.php': {
        target: 'http://mondaytalks',
        changeOrigin: true,
      },
      '/send_message.php': {
        target: 'http://mondaytalks',
        changeOrigin: true,
      },
      '/poll_messages.php': {
        target: 'http://mondaytalks',
        changeOrigin: true,
      }
    }
  }
})