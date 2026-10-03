import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { GALAXY_TEXTURES } from './data/photorealAssets.js'

const publicRoot = fileURLToPath(new URL('../../../public/', import.meta.url))

test('all real planetary maps are vendored locally as bounded JPEG assets', () => {
  assert.deepEqual(Object.keys(GALAXY_TEXTURES).sort(), ['earth', 'identity', 'journey', 'moon', 'projects', 'skills', 'sun'])
  for (const [body, path] of Object.entries(GALAXY_TEXTURES).filter(([key]) => key !== 'earth')) {
    assert.ok(path.startsWith('/galaxy/photoreal/') && path.endsWith('.jpg'), body)
    const bytes = readFileSync(publicRoot + path.slice(1))
    assert.equal(bytes[0], 0xff, body)
    assert.equal(bytes[1], 0xd8, body)
    assert.ok(bytes.length > 40_000 && bytes.length < 1_200_000, body + ' expected an optimized physical JPEG')
  }
})

test('Earth imagery has physical local JPEG/PNG payloads (including the full cloud atlas)', () => {
  const entries = Object.entries(GALAXY_TEXTURES.earth)
  assert.deepEqual(entries.map(([name]) => name), ['dayHigh', 'dayLow', 'night', 'cloud', 'water', 'elevation'])
  for (const [role, path] of entries) {
    const bytes = readFileSync(publicRoot + path.slice(1))
    assert.ok(path.startsWith('/galaxy/photoreal/earth/'), role)
    assert.ok(bytes.length > 100_000 && bytes.length < 2_000_000, role + ' is missing or unbounded')
    if (path.endsWith('.png')) {
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', role)
    } else {
      assert.equal(bytes[0], 0xff, role)
      assert.equal(bytes[1], 0xd8, role)
    }
  }
})


test('Earth water and terrain elevation are distinct registered raster atlases, with verified native sizes', () => {
  for (const [key, width, height] of [['water', 1600, 800], ['elevation', 2048, 1024]]) {
    const path = GALAXY_TEXTURES.earth[key]
    const bytes = readFileSync(publicRoot + path.slice(1))
    assert.equal(bytes.readUInt32BE(16), width, key + ' width')
    assert.equal(bytes.readUInt32BE(20), height, key + ' height')
  }
  assert.notEqual(GALAXY_TEXTURES.earth.water, GALAXY_TEXTURES.earth.elevation)
})
