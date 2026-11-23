import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Cube Portal preview reuses the GLB already tracked in /prototypes.
// Allow Vite's dev file server to read this repository-local asset without copying it.
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { fs: { allow: [repositoryRoot] } },
  build: { manifest: true },
})
