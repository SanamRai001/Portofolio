import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

import { GALAXY_METADATA } from '../src/pages/Galaxy/projectMetadata.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const original = await readFile(resolve(dist, 'index.html'), 'utf8')
const manifest = JSON.parse(await readFile(resolve(dist, '.vite/manifest.json'), 'utf8'))
const rootPlaceholder = '<div id="root"></div>'

assert.ok(original.includes(rootPlaceholder), 'Client build must have an empty #root to prerender')
assert.ok(original.includes('<title>Sanam Rai | Backend & Full-Stack Developer in Nepal</title>'))

function replaceRequired(html, before, after, label) {
  assert.ok(html.includes(before), 'Cannot find original ' + label)
  return html.replace(before, after)
}

// The Galaxy shell must not receive the homepage's prerendered markup. Project
// detail pages already have their own prerendered metadata and are left intact.
function galaxyShell(source) {
  let html = source
  html = replaceRequired(
    html,
    '<title>Sanam Rai | Backend & Full-Stack Developer in Nepal</title>',
    '<title>' + GALAXY_METADATA.title + '</title>',
    'Galaxy title',
  )
  const replacements = [
    ['<link rel="canonical" href="https://sanam-rai.com.np/" />',
      '<link rel="canonical" href="' + GALAXY_METADATA.url + '" />'],
    ['<meta property="og:url" content="https://sanam-rai.com.np/" />',
      '<meta property="og:url" content="' + GALAXY_METADATA.url + '" />'],
    ['<meta property="og:title" content="Sanam Rai | Backend & Full-Stack Developer" />',
      '<meta property="og:title" content="' + GALAXY_METADATA.title + '" />'],
    ['<meta name="twitter:title" content="Sanam Rai | Backend & Full-Stack Developer" />',
      '<meta name="twitter:title" content="' + GALAXY_METADATA.title + '" />'],
  ]
  for (const [before, after] of replacements) html = replaceRequired(html, before, after, 'Galaxy metadata')
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    '<meta name="description" content="' + GALAXY_METADATA.description + '" />',
  ).replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    '<meta property="og:description" content="' + GALAXY_METADATA.description + '" />',
  ).replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    '<meta name="twitter:description" content="' + GALAXY_METADATA.description + '" />',
  )
  return html
}

// The homepage chunk is lazy-loaded for route isolation. Its CSS still needs
// to be available before the browser paints prerendered markup.
function homepageStyles() {
  const visited = new Set()
  const styles = new Set()
  function walk(key) {
    if (visited.has(key)) return
    visited.add(key)
    const entry = manifest[key]
    assert.ok(entry, 'Missing manifest chunk: ' + key)
    for (const file of entry.css || []) styles.add(file)
    for (const dependency of entry.imports || []) walk(dependency)
  }
  walk('src/App.jsx')
  assert.ok(styles.size > 0, 'Homepage CSS must be discoverable from the build manifest')
  return [...styles].map(file => '<link rel="stylesheet" href="/' + file + '" />').join('\n    ')
}

const vite = await createServer({
  root,
  configFile: resolve(root, 'vite.config.js'),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

let markup
try {
  const server = await vite.ssrLoadModule('/src/prerenderHomepage.jsx')
  markup = server.renderHomepage()
} finally {
  await vite.close()
}
assert.ok(markup.includes('<h1 id="hero-title"'), 'Server output must contain homepage identity')
assert.ok(markup.includes('Sanam Rai'), 'Identity missing from server HTML')
assert.ok(markup.includes('Projects, through an engineering lens.'), 'Selected projects missing from server HTML')
assert.ok(markup.includes('Backend Feature Control Panel'), 'Backend Lab markup missing')

// Preserve the original SPA shell for the interactive Galaxy and its nested routes.
await mkdir(resolve(dist, 'galaxy'), { recursive: true })
await writeFile(resolve(dist, 'galaxy/index.html'), galaxyShell(original), 'utf8')

const home = original
  .replace('</head>', '    ' + homepageStyles() + '\n  </head>')
  .replace(rootPlaceholder, '<div id="root">' + markup + '</div>')
await writeFile(resolve(dist, 'index.html'), home, 'utf8')
console.log('Prerendered homepage from real React tree; kept separate Galaxy shell.')
