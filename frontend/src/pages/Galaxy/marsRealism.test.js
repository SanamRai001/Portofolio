import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ClampToEdgeWrapping, RepeatWrapping, Scene, SRGBColorSpace, Texture,
} from 'three'
import { PLANETS } from './data/solarSystem.js'
import { PROJECTS_APPEARANCE } from './data/projects.js'
import { GALAXY_TEXTURES } from './data/photorealAssets.js'
import { createProjectsPlanet } from './scene/ProjectsPlanet.js'
import {
  configureMarsAtlas, createMarsSurfaceMaterial, MARS_FRAGMENT, MARS_VERTEX,
} from './scene/MarsRealism.js'
import { disposeScene } from './utils/disposeScene.js'

const mars = PLANETS.find(body => body.id === 'projects')
function release(group) {
  const scene = new Scene(); scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}

test('G2R.14 Mars uses photographic source albedo, natural terminator and no fictional night settlements', () => {
  assert.equal(GALAXY_TEXTURES.projects, '/galaxy/photoreal/mars.jpg')
  assert.match(MARS_VERTEX, /vMarsCenter = \(modelMatrix \* vec4\(0\., 0\., 0\., 1\.\)\)\.xyz/)
  assert.match(MARS_FRAGMENT, /vec3 L = normalize\(-vMarsCenter\)/)
  assert.match(MARS_FRAGMENT, /float daylight = smoothstep\(-\.16, \.11, sunDot\)/)
  assert.match(MARS_FRAGMENT, /irradiance = mix\(\.008, \.035 \+ max\(sunDot, 0\.\) \* 1\.27, daylight\)/)
  assert.match(MARS_FRAGMENT, /vec3 albedo = mix\(source, natural, \.17\)/)
  assert.doesNotMatch(MARS_FRAGMENT, /cityCluster|nightMap|settlement lights|emissionMap/)
  assert.match(MARS_FRAGMENT, /#include <tonemapping_fragment>/)
  assert.match(MARS_FRAGMENT, /#include <colorspace_fragment>/)
})

test('G2R.14 Mars atlas uses bounded longitude join; albedo is never called MOLA topography', () => {
  assert.match(MARS_FRAGMENT, /sampleMarsAlbedo\(vMarsUv\)/)
  assert.match(MARS_FRAGMENT, /edge < \.025/)
  assert.match(MARS_FRAGMENT, /vec2\(1\. - uv\.x, uv\.y\)/)
  assert.match(MARS_FRAGMENT, /#if MARS_DETAIL_HIGH == 1/)
  assert.match(MARS_FRAGMENT, /albedoHere - albedoEast/)
  assert.match(MARS_FRAGMENT, /albedoHere - albedoNorth/)
  const hi = new Texture(), lo = new Texture()
  const high = createMarsSurfaceMaterial(false, hi), low = createMarsSurfaceMaterial(true, lo)
  assert.equal(high.defines.MARS_DETAIL_HIGH, 1)
  assert.equal(low.defines.MARS_DETAIL_HIGH, 0)
  for (const [material, texture] of [[high, hi], [low, lo]]) {
    assert.equal(material.uniforms.dayMap.value, texture)
    assert.equal(texture.colorSpace, SRGBColorSpace)
    assert.equal(texture.wrapS, RepeatWrapping)
    assert.equal(texture.wrapT, ClampToEdgeWrapping)
    material.dispose(); texture.dispose()
  }
  const configured = configureMarsAtlas(new Texture())
  assert.equal(configured.colorSpace, SRGBColorSpace)
  configured.dispose()
})

test('G2R.14 Mars fallback and desktop haze are restrained, mobile does not add meshes', () => {
  const full = createProjectsPlanet(mars, false)
  const low = createProjectsPlanet(mars, true)
  const highSurface = full.group.getObjectByName('projects-surface')
  const lowSurface = low.group.getObjectByName('projects-surface')
  assert.ok(highSurface)
  assert.equal(highSurface.material.vertexColors, true)
  assert.equal(lowSurface.material.vertexColors, true)
  assert.equal(full.group.getObjectByName('projects-night-side'), undefined)
  assert.equal(low.group.getObjectByName('projects-night-side'), undefined)
  assert.equal(full.group.children.length, 2, 'only surface and desktop dust limb')
  assert.equal(low.group.children.length, 1, 'mobile only gets the surface')
  const haze = full.group.getObjectByName('projects-dust-limb')
  assert.equal(haze.material.uniforms.strength.value, PROJECTS_APPEARANCE.dustStrength)
  assert.equal(PROJECTS_APPEARANCE.dustStrength, .105)
  assert.ok(PROJECTS_APPEARANCE.dustScale < 1.021)
  assert.equal(low.group.getObjectByName('projects-dust-limb'), undefined)
  assert.ok(lowSurface.geometry.attributes.position.count < highSurface.geometry.attributes.position.count)
  const angle = highSurface.rotation.y
  full.update(.05, true)
  assert.notEqual(highSurface.rotation.y, angle)
  const frozen = highSurface.rotation.y
  full.update(.05, false)
  assert.equal(highSurface.rotation.y, frozen)
  release(full.group); release(low.group)
})

test('G2R.14 material ownership: installed source map is released by the scene once', () => {
  const tex = new Texture()
  const material = createMarsSurfaceMaterial(false, tex)
  let countMap = 0, countMaterial = 0
  tex.addEventListener('dispose', () => countMap++)
  material.addEventListener('dispose', () => countMaterial++)
  const group = createProjectsPlanet(mars, true)
  const surface = group.group.getObjectByName('projects-surface')
  surface.material.dispose()
  surface.material = material
  release(group.group)
  assert.equal(countMaterial, 1)
  assert.equal(countMap, 1)
})
