import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CUBE_PREVIEW_PATH, cubeUrl, readCubeView, portalDuration } from '../src/pages/CubePortal/cubePortalNavigation.js'

const at = relative => fileURLToPath(new URL(relative, import.meta.url))
const text = relative => readFileSync(at(relative), 'utf8')

test('cube preview hash route and reduced motion are deterministic', () => {
  assert.equal(CUBE_PREVIEW_PATH, '/cube-preview')
  assert.equal(readCubeView('#work'), 'work')
  assert.equal(readCubeView('#home'), 'home')
  assert.equal(readCubeView('#garbage'), 'home')
  assert.equal(cubeUrl('work'), '/cube-preview#work')
  assert.equal(cubeUrl('home'), '/cube-preview#home')
  assert.equal(portalDuration('work', true), 0)
  assert.equal(portalDuration('work', false), 720)
  assert.equal(portalDuration('home', false), 640)
})

test('preview route does not replace the established homepage or Galaxy', () => {
  const routes = text('../src/PortfolioRoutes.jsx')
  assert.match(routes, /const Portfolio = lazy\(/)
  assert.match(routes, /const Galaxy = lazy\(/)
  assert.match(routes, /const CubePortalPreview = lazy\(/)
  assert.match(routes, /cubePreview \? <CubePortalPreview \/> : <Portfolio \/>/)
  const vercel = JSON.parse(text('../vercel.json'))
  assert.deepEqual(vercel.rewrites.find(x => x.source === '/cube-preview'), {source:'/cube-preview',destination:'/index.html'})
  assert.ok(vercel.rewrites.find(x => x.source === '/about'))
  assert.ok(vercel.rewrites.find(x => x.source === '/galaxy'))
  assert.deepEqual(vercel.headers.find(x => x.source === '/cube-preview').headers[0], {key:'X-Robots-Tag',value:'noindex, nofollow'})
})

test('real GLB model is reused rather than copied into frontend', () => {
  const bytes = readFileSync(at('../../prototypes/unfolding-cube-portal/assets/stone-cube.glb'))
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  const imagePath = at('../../prototypes/unfolding-cube-portal/assets/stone-cube-fallback.webp')
  assert.equal(existsSync(imagePath), true)
  const scene = text('../src/pages/CubePortal/createCubeScene.js')
  assert.match(scene, /stone-cube\.glb\?url/)
  assert.match(scene, /new GLTFLoader\(/)
  assert.match(scene, /dispose\(\)/)
  const vite = text('../vite.config.js')
  assert.match(vite, /repositoryRoot/)
})

test('portal retains keyboard navigation, focus and explicit non-indexable preview status', () => {
  const jsx = text('../src/pages/CubePortal/CubePortal.jsx')
  assert.match(jsx, /onPop/)
  assert.match(jsx, /'Escape'/)
  assert.match(jsx, /aria-hidden=\{!isWork\}/)
  assert.match(jsx, /inert=\{!isWork\}/)
  assert.match(jsx, /noindex, nofollow/)
  assert.match(jsx, /\/\#system-controls/)
  assert.match(jsx, /href="\/galaxy"/)
  assert.match(jsx, /href="\/about"/)
})
