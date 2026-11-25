import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const MODEL = fileURLToPath(new URL('../../prototypes/unfolding-cube-portal/assets/stone-cube-canonical.glb', import.meta.url))
const SIDES = ['front', 'right', 'top', 'left', 'back', 'bottom']

function decodeGlb(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  const jsonLength = bytes.readUInt32LE(12)
  assert.equal(bytes.toString('ascii', 16, 20), 'JSON')
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'))
  const binHeader = 20 + jsonLength
  assert.equal(bytes.toString('ascii', binHeader + 4, binHeader + 8), 'BIN\0')
  return { document, bytes, binaryStart: binHeader + 8 }
}

function zExtent(asset, nodeName) {
  const { document, bytes, binaryStart } = asset
  const node = document.nodes.find(candidate => candidate.name === nodeName)
  assert.ok(node, `Missing GLB mesh node ${nodeName}`)
  const primitive = document.meshes[node.mesh].primitives[0]
  const accessor = document.accessors[primitive.attributes.POSITION]
  const view = document.bufferViews[accessor.bufferView]
  assert.equal(accessor.type, 'VEC3')
  assert.equal(accessor.componentType, 5126) // float32
  const stride = view.byteStride || 12
  const first = binaryStart + (view.byteOffset || 0) + (accessor.byteOffset || 0)
  let min = Infinity, max = -Infinity
  for (let i = 0; i < accessor.count; i++) {
    const z = bytes.readFloatLE(first + i * stride + 8)
    min = Math.min(min, z)
    max = Math.max(max, z)
  }
  return { min, max, transform: JSON.stringify(node.matrix ?? [node.translation, node.rotation, node.scale]) }
}

test('six backing panels sit safely behind displaced stone, preventing gray geometry bleed-through', () => {
  const glb = decodeGlb(readFileSync(MODEL))
  for (const side of SIDES) {
    const stone = zExtent(glb, `stone_${side}`)
    const backing = zExtent(glb, `shell_${side}`)
    assert.equal(stone.transform, backing.transform, `${side}: panels must share a transform`)
    const clearance = stone.min - backing.max
    assert.ok(clearance >= 0.015,
      `${side}: backing intersects stone (clearance ${clearance.toFixed(5)}); this creates flat gray patches`)
  }
})

// A distinct real emissive seam must travel with the top face during unfolding.
test('new stone model has a top seam and independent normal-mapped material', () => {
  const { document } = decodeGlb(readFileSync(MODEL))
  const seam = document.nodes.find(node => node.name === 'seam_top')
  assert.ok(seam, 'top golden seam is missing')
  const material = document.materials.find(mat => mat.name === 'charcoal_slate_top')
  assert.ok(material, 'stone PBR material missing')
  assert.ok(material.normalTexture, 'normal mapped surface detail missing')
})
