import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(dir, './src') },
    // Çift React tuzağına karşı (lucide/framer gibi paketler eklendiğinde)
    dedupe: ['react', 'react-dom'],
  },
  // Sabit port: Kaan'ın diğer projeleriyle çakışmasın (bkz. .claude/launch.json)
  server: { port: 5191, strictPort: true },
})
