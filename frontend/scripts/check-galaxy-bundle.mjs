import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../dist/.vite/manifest.json', import.meta.url), 'utf8'))
// Vite may key a shared dynamic entry by its emitted filename instead of src.
const galaxy = Object.keys(manifest).find((key) => manifest[key].name === 'GalaxyPage' && manifest[key].isDynamicEntry)
const scene = 'src/pages/Galaxy/scene/createGalaxyScene.js'
const home = 'src/App.jsx'
function imports(key, seen = new Set()) {
  if (seen.has(key)) return seen
  assert.ok(manifest[key], `Missing build chunk: ${key}`)
  seen.add(key)
  for (const dependency of manifest[key].imports || []) imports(dependency, seen)
  return seen
}
const initial = imports('index.html')
assert.ok(manifest[galaxy]?.isDynamicEntry, 'Galaxy must be a dynamic entry')
assert.ok(manifest[scene]?.isDynamicEntry, 'Scene must be a dynamic entry')
for (const key of initial) {
  assert.ok(!/Galaxy|three|src\/App/.test(key), `Experience code leaked into initial entry: ${key}`)
}
assert.ok(!imports(home).has(galaxy), 'Homepage must not preload Galaxy')
assert.ok(!imports(home).has(scene), 'Homepage must not preload Galaxy scene')
assert.ok(!imports(galaxy).has(home), 'Galaxy must not load backend portfolio')
assert.ok(!imports(galaxy).has(scene), 'WebGL scene must stay behind error handling')
console.log('Galaxy build isolation passed: lazy route + lazy scene; no Galaxy in homepage imports.')
