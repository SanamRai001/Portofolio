import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Cube Portal preview reuses the GLB already tracked in /prototypes.
// Allow Vite's dev file server to read this repository-local asset without copying it.
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

// Mirror the production static About rewrite before the SPA fallback.
function staticAboutRewrite() {
  const install = server => {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.split('?')[0] === '/about') req.url = '/about/index.html' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')
      next()
    })
  }
  return { name: 'static-about-rewrite', configureServer: install, configurePreviewServer: install }
}

export default defineConfig({
  plugins: [staticAboutRewrite(), react(), tailwindcss()],
  server: { fs: { allow: [repositoryRoot] } },
  build: { manifest: true },
})
