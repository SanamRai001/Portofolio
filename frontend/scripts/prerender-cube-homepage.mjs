import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { JSDOM } from 'jsdom'
import { GALAXY_METADATA } from '../src/pages/Galaxy/projectMetadata.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const original = await readFile(resolve(dist, 'index.html'), 'utf8')
const manifest = JSON.parse(await readFile(resolve(dist, '.vite/manifest.json'), 'utf8'))
const placeholder = '<div id="root"></div>'
assert.ok(original.includes(placeholder), 'Expected clean SPA shell')

const artwork = (await readdir(resolve(dist, 'assets'))).filter(name => /^reference-cube-[\w-]+\.png$/.test(name))
assert.equal(artwork.length, 1, 'Exactly one emitted cube artwork is expected')
const artworkUrl = '/assets/' + artwork[0]
const cubeKey = Object.keys(manifest).find(key => manifest[key].src === 'src/pages/CubePortal/CubePortal.jsx' || key === 'src/pages/CubePortal/CubePortal.jsx')
assert.ok(cubeKey, 'Cube dynamic chunk missing')
const styles = new Set()
const visited = new Set()
function walk(key) {
  if (visited.has(key)) return
  visited.add(key)
  const item = manifest[key]
  assert.ok(item, 'Missing manifest chunk ' + key)
  assert.ok(!/Galaxy|three|gsap|src\/App\.jsx/.test(key), 'Heavy route leaked into cube: ' + key)
  for (const css of item.css || []) styles.add(css)
  for (const dependency of item.imports || []) walk(dependency)
}
walk(cubeKey)
assert.ok(styles.size, 'Cube stylesheet missing')
const styleLinks = [...styles].map(file => '<link rel="stylesheet" href="/' + file + '" />').join('\n    ')

const vite = await createServer({
  root, configFile: resolve(root, 'vite.config.js'),
  server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
})
let markup
try {
  const { renderCubeHomepage } = await vite.ssrLoadModule('/src/prerenderCubeHomepage.jsx')
  markup = renderCubeHomepage(artworkUrl)
} finally { await vite.close() }

const home = original.replace('</head>', '    ' + styleLinks + '\n  </head>')
  .replace(placeholder, () => '<div id="root" data-prerender="cube-v1">' + markup + '</div>')
const page = new JSDOM(home)
try {
  const doc = page.window.document
  assert.equal(doc.querySelector('.CubePortal')?.dataset.phase, 'home')
  assert.ok(doc.querySelector('#cube-title')?.textContent.includes('Ideas into'))
  assert.match(doc.querySelector('.CubeIntro').textContent, /Sanam Rai.*backend-focused full-stack developer/)
  assert.equal(doc.querySelector('.CubeArtworkBody').getAttribute('href'), artworkUrl)
  assert.equal(doc.querySelectorAll('.CubeCaseStudy').length, 5)
  assert.ok(doc.querySelector('a[href="#work"]'))
  assert.ok(doc.querySelector('a[href="/lab?from=cube"]'))
  assert.ok(doc.querySelector('a[href="/about?from=cube"]'))
  assert.ok(doc.querySelector('a[href="/galaxy"]'))
  assert.equal(doc.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://sanam-rai.com.np/')
  assert.match(doc.querySelector('meta[name="robots"]').content, /^index, follow/)
  assert.ok(!home.includes('/@fs/'), 'Build must not expose dev asset paths')
  assert.ok(!home.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING'), 'Homepage must actually render on server')
  for (const css of styles) assert.ok(doc.querySelector('link[href="/' + css + '"]'))
} finally { page.window.close() }

// Keep every non-home entry empty so no cube flashes before Lab/Galaxy loads.
const galaxyPage = new JSDOM(original)
const galaxyDoc = galaxyPage.window.document
galaxyDoc.title = GALAXY_METADATA.title
galaxyDoc.querySelector('link[rel="canonical"]').setAttribute('href', GALAXY_METADATA.url)
for (const [selector,value] of [
  ['meta[name="description"]',GALAXY_METADATA.description],
  ['meta[property="og:url"]',GALAXY_METADATA.url],
  ['meta[property="og:title"]',GALAXY_METADATA.title],
  ['meta[property="og:description"]',GALAXY_METADATA.description],
  ['meta[name="twitter:title"]',GALAXY_METADATA.title],
  ['meta[name="twitter:description"]',GALAXY_METADATA.description],
]) galaxyDoc.querySelector(selector).setAttribute('content',value)
const galaxy = galaxyPage.serialize()
galaxyPage.window.close()
await mkdir(resolve(dist, 'galaxy'), { recursive: true })
await writeFile(resolve(dist, 'galaxy/index.html'), galaxy, 'utf8')
await writeFile(resolve(dist, 'app-shell.html'), original, 'utf8')
await writeFile(resolve(dist, 'index.html'), home, 'utf8')
console.log('Verified prerendered Cube homepage, styles, project links and separate SPA shells.')
