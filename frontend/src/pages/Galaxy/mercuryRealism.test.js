import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ClampToEdgeWrapping, RepeatWrapping, Scene, SRGBColorSpace, Texture,
} from 'three'
import { PLANETS } from './data/solarSystem.js'
import { GALAXY_TEXTURES } from './data/photorealAssets.js'
import { createSkillsPlanet } from './scene/SkillsPlanet.js'
import {
  configureMercuryAtlas, createMercurySurfaceMaterial,
  MERCURY_VERTEX, MERCURY_FRAGMENT,
} from './scene/MercuryRealism.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { disposeScene } from './utils/disposeScene.js'

const mercury = PLANETS.find(body => body.id === 'skills')
function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.15 Mercury renderer has airless natural-colour albedo and an explicit daylight terminator', () => {
  assert.equal(GALAXY_TEXTURES.skills, '/galaxy/photoreal/mercury.jpg')
  const atlas = new Texture()
  const material = createMercurySurfaceMaterial(false, atlas)
  const lowAtlas = new Texture()
  const mobile = createMercurySurfaceMaterial(true, lowAtlas)
  assert.equal(material.defines.MERCURY_DETAIL_HIGH, 1)
  assert.equal(mobile.defines.MERCURY_DETAIL_HIGH, 0)
  assert.equal(atlas.colorSpace, SRGBColorSpace)
  assert.equal(atlas.wrapS, RepeatWrapping)
  assert.equal(atlas.wrapT, ClampToEdgeWrapping)
  assert.equal(configureMercuryAtlas(lowAtlas), lowAtlas)
  assert.match(MERCURY_VERTEX, /vMercuryCenter = \(modelMatrix \* vec4\(0\., 0\., 0\., 1\.\)\)\.xyz/)
  assert.match(MERCURY_FRAGMENT, /texture2D\(dayMap, uv\)/)
  assert.match(MERCURY_FRAGMENT, /edge < \.019/)
  assert.match(MERCURY_FRAGMENT, /vec2\(1\. - uv\.x, uv\.y\)/)
  assert.match(MERCURY_FRAGMENT, /vec3 neutralRock/)
  assert.match(MERCURY_FRAGMENT, /mix\(source, neutralRock, \.32\)/)
  assert.match(MERCURY_FRAGMENT, /sunDot = dot\(N, L\)/)
  assert.match(MERCURY_FRAGMENT, /smoothstep\(-\.065, \.055, sunDot\)/)
  assert.match(MERCURY_FRAGMENT, /#include <tonemapping_fragment>/)
  assert.match(MERCURY_FRAGMENT, /#include <colorspace_fragment>/)
  assert.doesNotMatch(MERCURY_FRAGMENT, /emissive|metalness|nightLights|cityCluster|haze|atmosphere/)
  material.dispose()
  mobile.dispose()
  atlas.dispose()
  lowAtlas.dispose()
})

test('G2R.15 fine albedo contrast is desktop-only; it is not passed off as true crater elevation', () => {
  assert.match(MERCURY_FRAGMENT, /#if MERCURY_DETAIL_HIGH == 1/)
  assert.match(MERCURY_FRAGMENT, /localContrast/)
  assert.match(MERCURY_FRAGMENT, /source \*= 1\. \+ localContrast \* \.31/)
  assert.doesNotMatch(MERCURY_FRAGMENT, /bumpMap|displacementMap|elevationMap|metallic/)
})

test('G2R.15 fallback stays opaque and nonmetallic and satellites are not children of the spinning globe', () => {
  for (const lowPower of [false, true]) {
    const planet = createSkillsPlanet(mercury, lowPower)
    const globe = planet.group.getObjectByName('skills-surface')
    const nodes = planet.group.getObjectByName('skills-satellites')
    assert.equal(globe.material.vertexColors, true, 'missing JPEG retains procedural fallback')
    assert.equal(globe.material.metalness, 0)
    assert.ok(globe.material.roughness >= .98)
    assert.equal(globe.material.map, null)
    assert.equal(globe.rotation.z, mercury.rotation.axialTilt)
    assert.equal(nodes.parent, planet.group)
    assert.notEqual(nodes.parent, globe)
    const groupAngle = nodes.rotation.y
    const beforeYaw = globe.rotation.y
    planet.update(.05, true)
    assert.notEqual(globe.rotation.y, beforeYaw)
    assert.equal(nodes.rotation.y, groupAngle)
    assert.equal(planet.hitMeshes.length, 0, 'not selectable before Skills focus')
    planet.setSelection({
      selectedBodyId: 'skills', mode: 'body_focused',
      selectedSkillId: null, hoveredSkillId: null,
    })
    assert.equal(planet.hitMeshes.length, 10)
    assert.ok(nodes.visible)
    const initialNode = planet.nodes.get('node').root.position.clone()
    for (let frame = 0; frame < 160; frame++) planet.update(.05, true)
    assert.ok(planet.nodes.get('node').root.position.distanceTo(initialNode) > .01)
    const beforeFreeze = globe.rotation.y
    const position = planet.nodes.get('node').root.position.clone()
    planet.update(.05, false)
    assert.equal(globe.rotation.y, beforeFreeze)
    assert.deepEqual(planet.nodes.get('node').root.position.toArray(), position.toArray())
    release(planet.group)
  }
})

test('G2R.15 focused Mercury still revolves independently while its ten skill targets remain available', () => {
  const system = createSolarSystem({ lowPower: false })
  system.resize(false)
  const state = {
    selectedBodyId: 'skills', hoveredBodyId: null, mode: 'body_focused',
    selectedSkillId: null, hoveredSkillId: null,
  }
  system.setInteraction(state, true)
  const globe = system.targets.get('skills').visuals.getObjectByName('skills-surface')
  const constellation = system.targets.get('skills').visuals.getObjectByName('skills-satellites')
  const root = system.bodies.get('skills')
  assert.equal(system.hitMeshes.filter(mesh => String(mesh.userData.bodyId).startsWith('skill:')).length, 10)
  const originalPosition = root.position.clone(), originalYaw = globe.rotation.y
  const originalConstellationAngle = constellation.rotation.y
  for (let i = 0; i < 160; i++) system.update(.05, true)
  assert.ok(root.position.distanceTo(originalPosition) > .25, 'focused world root keeps revolving')
  assert.notEqual(globe.rotation.y, originalYaw, 'surface rotates on its own tilted axis')
  assert.equal(constellation.rotation.y, originalConstellationAngle, 'skill node plane is not dragged by globe spin')
  const fixedPosition = root.position.clone(), fixedYaw = globe.rotation.y
  system.update(.05, false)
  assert.deepEqual(root.position.toArray(), fixedPosition.toArray())
  assert.equal(globe.rotation.y, fixedYaw)
  system.dispose()
  release(system.group)
})
