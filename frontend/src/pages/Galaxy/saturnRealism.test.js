import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene, Vector3 } from 'three'
import { PLANETS } from './data/solarSystem.js'
import { createJourneyPlanet } from './scene/JourneyPlanet.js'
import { createJourneyRings } from './scene/JourneyRings.js'
import { SATURN_RING_RADII, SATURN_RING_PROFILE_GLSL } from './scene/SaturnOptics.js'
import { SATURN_SURFACE_FRAGMENT, SATURN_SURFACE_VERTEX } from './scene/SaturnRealism.js'
import { disposeScene } from './utils/disposeScene.js'

const body = PLANETS.find(b => b.id === 'journey')
function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.13 ring C/B/Cassini/A coverage uses a common radial optical profile', () => {
  assert.equal(body.ring[0], SATURN_RING_RADII.inner)
  assert.equal(body.ring[1], SATURN_RING_RADII.outer)
  const text = SATURN_RING_PROFILE_GLSL
  assert.match(text, /float saturnRingDensity\(float r\)/)
  assert.match(text, /float c = smoothstep\(1\.235/)
  assert.match(text, /float b = smoothstep\(1\.530/)
  assert.match(text, /float a = smoothstep\(2\.030/)
  assert.match(text, /float cassiniRinglet = exp\(/)
  assert.match(text, /2\.212\) \* 370\./)
  assert.match(SATURN_SURFACE_FRAGMENT, /saturnRingDensity\(crossingRadius\)/)
  assert.match(SATURN_SURFACE_FRAGMENT, /rayT > 0\./)
  assert.match(SATURN_SURFACE_FRAGMENT, /abs\(denominator\) > \.025/)
  assert.match(SATURN_SURFACE_VERTEX, /ringNormalSurface/)
  assert.match(SATURN_SURFACE_FRAGMENT, /#include <colorspace_fragment>/)
})

test('G2R.13 ring plane and spinning cloud top agree, with no extra GPU surface layer', () => {
  const high = createJourneyPlanet(body, false), low = createJourneyPlanet(body, true)
  for (const [presentation, isLow] of [[high, false], [low, true]]) {
    const ringGroup = presentation.group.getObjectByName('journey-rings')
    const ring = ringGroup.getObjectByName('journey-ring-bands')
    const surface = presentation.group.getObjectByName('journey-surface')
    assert.equal(ringGroup.rotation.z, body.rotation.axialTilt)
    assert.equal(ring.rotation.x, -Math.PI / 2)
    assert.equal(ring.rotation.y, 0)
    assert.equal(surface.material.defines.SATURN_HIGH_QUALITY, isLow ? 0 : 1)
    assert.equal(ring.material.defines.RING_DETAIL_HIGH, isLow ? 0 : 1)
    assert.equal(surface.material.uniforms.planetRadius.value, body.radius)
    assert.equal(surface.material.uniforms.dayMap.value.isDataTexture, true)
    const outwardNormal = new Vector3(0, 0, 1)
      .applyQuaternion(ring.quaternion).applyQuaternion(ringGroup.quaternion).normalize()
    function assertAligned() {
      const fromSurface = surface.material.uniforms.ringNormalSurface.value.clone()
        .applyQuaternion(surface.quaternion).normalize()
      assert.ok(fromSurface.distanceTo(outwardNormal) < 1e-6)
    }
    assertAligned()
    const ringRotation = ring.rotation.toArray(), groupRotation = ringGroup.rotation.toArray()
    const initialAngle = surface.rotation.y
    presentation.update(.05, true)
    assert.notEqual(surface.rotation.y, initialAngle)
    assertAligned()
    presentation.update(.05, false)
    assertAligned()
    assert.deepEqual(ring.rotation.toArray(), ringRotation)
    assert.deepEqual(ringGroup.rotation.toArray(), groupRotation)
  }
  release(high.group); release(low.group)
})

test('G2R.13 Journey-only focus reveals finer rings without changing the shared camera clearance', () => {
  // Against the former 10-unit/42-degree Journey baseline. The same geometry
  // now covers >25% more projected height at desktop and portrait sizes.
  const oldProjection = 1 / (10 * Math.tan(42 * Math.PI / 360))
  const newProjection = 1 / (body.focus.distance * Math.tan(body.focus.fov * Math.PI / 360))
  assert.equal(body.focus.distance, 8.2)
  assert.equal(body.focus.fov, 40)
  assert.ok(newProjection / oldProjection > 1.25)
})

test('G2R.13 low tier remains one geometry and shader, never two legacy discs', () => {
  const full = createJourneyRings(body, false), small = createJourneyRings(body, true)
  assert.equal(full.children.length, 1)
  assert.equal(small.children.length, 1)
  assert.ok(full.children[0].geometry.index.count > small.children[0].geometry.index.count)
  assert.ok(small.children[0].geometry.index.count <= 96 * 6)
  assert.equal(full.children[0].material.depthWrite, false)
  assert.equal(small.children[0].material.depthTest, true)
  assert.match(full.children[0].material.fragmentShader, /fwidth\(phase\)/)
  assert.match(full.children[0].material.fragmentShader, /vRingNormal/)
  assert.match(full.children[0].material.fragmentShader, /shadow = step\(0\., rayDistance\)/)
  assert.match(full.children[0].material.fragmentShader, /sunDirection = normalize\(-vPlanetCenter\)/)
  release(full); release(small)
})
