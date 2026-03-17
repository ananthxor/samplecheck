import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'))
  const supabaseUrl = env.VITE_SUPABASE_URL

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envDir: '../../',
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT) || 3005,
      allowedHosts: true,
      proxy: {
        '/track-event': {
          target: `${supabaseUrl}/functions/v1/track-event`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/track-event/, ''),
        },
        '/preview-impression': {
          target: `${supabaseUrl}/functions/v1/preview-impression`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/preview-impression/, ''),
        },
      },
    },
  }
})
