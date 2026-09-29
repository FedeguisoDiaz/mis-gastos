import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' permite publicar en GitHub Pages sin importar el nombre del repositorio
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 1500 },
  server: { host: true }, // permite abrirla desde el celu en la misma red WiFi
})
