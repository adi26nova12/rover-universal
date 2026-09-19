import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the project at /rover-universal/; the Pages workflow sets BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
