import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/usace': {
        target: 'https://www.nwd-wc.usace.army.mil',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/usace/, ''),
        secure: false,
      },
    },
  },
})
