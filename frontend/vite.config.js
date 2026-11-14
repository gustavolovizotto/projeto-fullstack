import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Porta fixa: é a origem liberada no CORS da API (FRONT_URL).
  server: { port: 5173, strictPort: true },
})
