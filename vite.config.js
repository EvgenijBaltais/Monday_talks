import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      'register_user.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
      'send_message.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
      'poll_messages.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
      'start_dialog.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
      'end_dialog.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
      'restore_dialog.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
      'api/dialogs.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
      'get_dialog_history.php': {
        target: 'http://mondaytalks/php/',
        changeOrigin: true,
      },
    }
  }
})