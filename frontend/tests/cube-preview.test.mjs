import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
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

test('layered preview reuses the exact approved artwork and does not load WebGL', () => {
  const bytes = readFileSync(at('../../prototypes/unfolding-cube-portal/source/reference-cube.png'))
  const gitBlob = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')
  assert.equal(gitBlob, '33c6c4a293b3f23550e5a1315d6928d344f56569')
  const scene = text('../src/pages/CubePortal/CubeScene.jsx')
  assert.match(scene, /reference-cube\.png\?url/)
  assert.match(scene, /viewBox="0 0 1254 1254"/)
  assert.match(scene, /clipPath=\{split \?/)
  assert.match(scene, /data-renderer="layered-artwork"/)
  assert.doesNotMatch(scene, /createCubeScene|GLTFLoader|WebGLRenderer|<canvas/)
  assert.match(text('../vite.config.js'), /repositoryRoot/)
})

test('portal retains keyboard navigation, focus and explicit non-indexable preview status', () => {
  const jsx = text('../src/pages/CubePortal/CubePortal.jsx')
  assert.match(jsx, /onPop/)
  assert.match(jsx, /'Escape'/)
  assert.match(jsx, /aria-hidden=\{!isWork\}/)
  assert.match(jsx, /inert=\{!isWork\}/)
  const cubeScene = text('../src/pages/CubePortal/CubeScene.jsx')
  assert.match(cubeScene, /MODEL_REVISION = 'original-artwork-tilt-v2'/)
  assert.match(cubeScene, /data-lid-open=\{open\}/)
  assert.match(cubeScene, /data-split=\{split\}/)
  assert.match(cubeScene, /cubeDebug/)
  assert.match(jsx, /highlightedDestination/)
  assert.match(jsx, /CubePortalGlimpse/)
  assert.match(jsx, /--portal-x/)
  assert.match(text('../src/pages/CubePortal/CubePortal.css'), /cubePortalChapterEnter/)
  assert.match(jsx, /noindex, nofollow/)
  assert.match(jsx, /\/\#system-controls/)
  assert.match(jsx, /href="\/galaxy"/)
  assert.match(jsx, /href="\/about"/)
})

test('pointer tilt is bounded, mouse-only, reset on leave and disabled during motion reduction', () => {
  const scene = text('../src/pages/CubePortal/CubeScene.jsx')
  assert.match(scene, /MAX_TILT = 7/)
  assert.match(scene, /phase !== 'home' \|\| reducedMotion/)
  assert.match(scene, /event.pointerType !== 'mouse'/)
  assert.match(scene, /pointerleave/)
  assert.match(scene, /cancelAnimationFrame/)
  assert.match(scene, /removeEventListener/)
  const css = text('../src/pages/CubePortal/CubePortal.css')
  assert.match(css, /perspective\(900px\)/)
  assert.match(css, /prefers-reduced-motion:reduce/)
})
