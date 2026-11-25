import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { PROJECT_NODES } from './src/pages/Galaxy/data/projects.js'

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
  const projectPaths = new Set(PROJECT_NODES.map(project => '/galaxy/projects/' + project.id))
  const preview = server => {
    install(server)
    server.middlewares.use((req, _res, next) => {
      const [path, query] = (req.url || '').split('?')
      const clean = path.replace(/\/+$/, '') || '/'
      let target
      if (['/lab','/lab-preview','/cube-preview'].includes(clean)) target = '/app-shell.html'
      else if (projectPaths.has(clean)) target = clean + '/index.html'
      else if (clean === '/galaxy' || clean.startsWith('/galaxy/')) {
        if (!/\.[a-z0-9]+$/i.test(clean)) target = '/galaxy/index.html'
      }
      if (target) req.url = target + (query ? '?' + query : '')
      next()
    })
  }
  return { name: 'static-about-rewrite', configureServer: install, configurePreviewServer: preview }
}

export default defineConfig({
  plugins: [staticAboutRewrite(), react(), tailwindcss()],
  server: { fs: { allow: [repositoryRoot] } },
  build: { manifest: true },
})
