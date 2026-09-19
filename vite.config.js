import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages publishes this repo straight from main / (root):
 *   - the source entry is app.html; `npm run build` writes the built
 *     index.html + assets/ to the repo root (scripts/publish-root.mjs)
 *   - models/, draco/, photos/ live at the root and are served as-is
 *   - base './' keeps every URL relative, so it works under /rover-universal/
 */
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    react(),
    {
      name: 'dev-entry',
      // dev: serve the source entry at / (the root index.html is the built site)
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url.startsWith('/?') || req.url === '/index.html') req.url = '/app.html'
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: { input: 'app.html' },
  },
})
