import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { GALAXY_TEXTURES } from './data/photorealAssets.js'

const publicRoot = fileURLToPath(new URL('../../../public/', import.meta.url))

test('all real planetary maps are vendored locally as bounded JPEG assets', () => {
  assert.deepEqual(Object.keys(GALAXY_TEXTURES).sort(), ['identity', 'journey', 'moon', 'projects', 'skills', 'sun'])
  for (const [body, path] of Object.entries(GALAXY_TEXTURES)) {
    assert.ok(path.startsWith('/galaxy/photoreal/') && path.endsWith('.jpg'), body)
    const bytes = readFileSync(publicRoot + path.slice(1))
    assert.equal(bytes[0], 0xff, body)
    assert.equal(bytes[1], 0xd8, body)
    assert.ok(bytes.length > 40_000 && bytes.length < 1_200_000, body + ' expected an optimized physical JPEG')
  }
})
