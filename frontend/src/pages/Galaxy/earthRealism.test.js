import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, Scene, SphereGeometry, Texture, Vector3 } from 'three'
import { PLANETS } from './data/solarSystem.js'
import { IDENTITY_COMPOSITION } from './data/identity.js'
import { createCameraRig } from './scene/CameraRig.js'
import { getOverview } from './utils/overview.js'
import { GALAXY_TEXTURES } from './data/photorealAssets.js'
import { createIdentityPlanet } from './scene/IdentityPlanet.js'
import {
  EARTH_SHADER_CONTRACT, createEarthAtmosphere, createEarthCloudMaterial,
  createEarthSurfaceMaterial, createEarthTextureController,
} from './scene/EarthRealism.js'
import { disposeScene } from './utils/disposeScene.js'


test('Earth final optical tuning preserves plausible glint/cloud opacity and enlarged mobile focus', () => {
  assert.match(EARTH_SHADER_CONTRACT.surface, /vec2 texel = vec2\(1\. \/ 2048\., 1\. \/ 1024\.\)/)
  assert.match(EARTH_SHADER_CONTRACT.surface, /pow\(reflection, 72\.\) \* irradiance \* \.24/)
  assert.match(EARTH_SHADER_CONTRACT.clouds, /coverage \* mix\(\.11, \.72, lit\)/)
  assert.equal(IDENTITY_COMPOSITION.mobile.heightFraction, .54)
  assert.equal(IDENTITY_COMPOSITION.mobile.fov, 30)
  assert.equal(IDENTITY_COMPOSITION.desktop.heightFraction, .45)
})


test('Earth-only mobile focus fills substantially more of the canvas while desktop framing stays unchanged', () => {
  const body = PLANETS.find(item => item.id === 'identity')
  for (const reducedMotion of [false, true]) {
    const rig = createCameraRig({ reducedMotion })
    rig.resize(346, 320, 390)
    rig.navigate({ selectedBodyId: 'identity', transitionId: 1, mode: 'body_focused' })
    const view = getOverview(346, 320)
    const distance = rig.camera.position.distanceTo(rig.target)
    const projectedRadius = body.radius * view.bodyScale / (distance * Math.tan(rig.camera.fov * Math.PI / 360))
    assert.equal(rig.camera.fov, 30)
    assert.ok(projectedRadius > .50, 'Earth should fill at least half the 320px phone stage')
    rig.resize(1360, 570, 1440)
    assert.equal(rig.camera.fov, body.focus.fov, 'desktop focus FOV is unchanged')
  }
})

const mockRenderer = () => ({ dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
function fakeLoader() {
  const pending = new Map()
  const loader = {
    load(path, onLoad, _onProgress, onError) {
      const map = new Texture()
      pending.set(path, { map, onLoad, onError })
      return map
    },
  }
  return { loader, pending }
}

test('Earth shader shares real solar direction, dark-only Black Marble lights, ocean-only glint and cloud atlas alpha', () => {
  assert.match(EARTH_SHADER_CONTRACT.surface, /dot\(N, L\)/)
  assert.match(EARTH_SHADER_CONTRACT.surface, /texture2D\(nightMap, vEarthUv\)/)
  assert.match(EARTH_SHADER_CONTRACT.surface, /1\. - smoothstep\(-\.24, \.08, sunDot\)/)
  assert.match(EARTH_SHADER_CONTRACT.surface, /city.*darkness/)
  assert.match(EARTH_SHADER_CONTRACT.surface, /water \* pow\(reflection/)
  assert.match(EARTH_SHADER_CONTRACT.surface, /EARTH_HIGH_QUALITY/)
  assert.match(EARTH_SHADER_CONTRACT.clouds, /texture2D\(cloudMap, vEarthUv\)/)
  assert.match(EARTH_SHADER_CONTRACT.clouds, /smoothstep\(\.19, \.72, cloudLuma\)/)
  assert.match(EARTH_SHADER_CONTRACT.atmosphere, /pow\(1\. - max\(dot\(N, V\), 0\.\), 4\.8\)/)
  assert.match(EARTH_SHADER_CONTRACT.atmosphere, /smoothstep\(-\.26, \.48, sunDot\)/)
  const sharedSun = new Vector3(-1, 0, 0)
  const maps = Object.fromEntries(['day', 'night', 'water', 'elevation'].map(name => [name, new Texture()]))
  const high = createEarthSurfaceMaterial({ maps, sunDirection: sharedSun })
  const low = createEarthSurfaceMaterial({ maps, lowPower: true, sunDirection: sharedSun })
  const cloud = createEarthCloudMaterial(new Texture(), sharedSun)
  const atmosphere = createEarthAtmosphere(1, sharedSun, false)
  assert.equal(high.defines.EARTH_HIGH_QUALITY, 1)
  assert.equal(low.defines.EARTH_HIGH_QUALITY, 0)
  assert.equal(high.uniforms.sunDirection.value, cloud.uniforms.sunDirection.value)
  assert.equal(high.uniforms.sunDirection.value, atmosphere.material.uniforms.sunDirection.value)
  assert.equal(cloud.transparent, true)
  assert.equal(cloud.depthWrite, false)
  assert.equal(atmosphere.material.depthWrite, false)
  const scene = new Scene()
  scene.add(new Mesh(new SphereGeometry(1, 8, 6), high), atmosphere)
  // The unused low/cloud materials are not scene-owned in this isolated test.
  low.dispose()
  cloud.dispose()
  disposeScene(scene, mockRenderer())
  Object.values(maps).forEach(map => map.dispose())
})

test('NASA Earth maps atomically install day/night and maps; clouds install independently; scene owns textures', () => {
  const { loader, pending } = fakeLoader()
  const paths = GALAXY_TEXTURES.earth
  let surfaceMaps, cloudMap, redraws = 0
  const controller = createEarthTextureController({
    paths: { ...paths, day: paths.dayHigh }, loader,
    onSurface(maps) { surfaceMaps = maps },
    onCloud(map) { cloudMap = map },
    onReady() { redraws++ },
  })
  assert.equal(controller.surfaceReady, false)
  pending.get(paths.dayHigh).onLoad(pending.get(paths.dayHigh).map)
  pending.get(paths.night).onLoad(pending.get(paths.night).map)
  assert.equal(controller.surfaceReady, false, 'must not install an incomplete high quality surface')
  pending.get(paths.cloud).onLoad(pending.get(paths.cloud).map)
  assert.equal(controller.cloudsReady, true)
  assert.equal(surfaceMaps, undefined)
  assert.equal(redraws, 1)
  pending.get(paths.water).onLoad(pending.get(paths.water).map)
  pending.get(paths.elevation).onLoad(pending.get(paths.elevation).map)
  assert.equal(controller.surfaceReady, true)
  assert.equal(redraws, 2)
  assert.equal(surfaceMaps.day.colorSpace, 'srgb')
  assert.equal(surfaceMaps.night.colorSpace, '')
  assert.equal(surfaceMaps.water.colorSpace, '')
  assert.equal(cloudMap, pending.get(paths.cloud).map)

  const sun = new Vector3(0, 0, -1)
  const scene = new Scene()
  const surface = new Mesh(new SphereGeometry(1, 8, 6),
    createEarthSurfaceMaterial({ maps: surfaceMaps, sunDirection: sun }))
  const clouds = new Mesh(new SphereGeometry(1.01, 8, 6), createEarthCloudMaterial(cloudMap, sun))
  scene.add(surface, clouds)
  let dayDisposals = 0, cloudDisposals = 0
  surfaceMaps.day.addEventListener('dispose', () => dayDisposals++)
  cloudMap.addEventListener('dispose', () => cloudDisposals++)
  controller.dispose()
  assert.equal(dayDisposals, 0)
  assert.equal(cloudDisposals, 0)
  disposeScene(scene, mockRenderer())
  assert.equal(dayDisposals, 1)
  assert.equal(cloudDisposals, 1)
})

test('missing night image never reveals partial Earth; late callbacks are disposed once; mobile requests only 3 maps', () => {
  const paths = GALAXY_TEXTURES.earth
  const first = fakeLoader()
  let surfaceCalls = 0, cloudCalls = 0
  const controller = createEarthTextureController({
    paths: { ...paths, day: paths.dayHigh }, loader: first.loader,
    onSurface() { surfaceCalls++ }, onCloud() { cloudCalls++ },
  })
  const day = first.pending.get(paths.dayHigh)
  let dayDisposals = 0
  day.map.addEventListener('dispose', () => dayDisposals++)
  day.onLoad(day.map)
  first.pending.get(paths.night).onError(new Error('HTTP 404'))
  assert.equal(dayDisposals, 1, 'orphaned day map is freed on load failure')
  first.pending.get(paths.water).onLoad(first.pending.get(paths.water).map)
  assert.equal(surfaceCalls, 0)
  controller.dispose()
  controller.dispose()
  day.onLoad(day.map)
  assert.equal(dayDisposals, 1, 'late callback does not double dispose')
  assert.equal(surfaceCalls, 0)
  assert.equal(cloudCalls, 0)
  const low = fakeLoader()
  const mobile = createEarthTextureController({
    paths: { ...paths, day: paths.dayLow }, lowPower: true, loader: low.loader,
    onSurface() { surfaceCalls++ }, onCloud() { cloudCalls++ },
  })
  assert.deepEqual([...low.pending.keys()], [paths.dayLow, paths.night, paths.cloud])
  low.pending.get(paths.dayLow).onLoad(low.pending.get(paths.dayLow).map)
  low.pending.get(paths.night).onLoad(low.pending.get(paths.night).map)
  assert.equal(mobile.surfaceReady, true)
  assert.equal(surfaceCalls, 1)
  mobile.dispose()
})

test('Identity keeps coherent layers, separate cloud rotation, Moon quality-tier and motion freeze', () => {
  const body = PLANETS.find(item => item.id === 'identity')
  const desktop = createIdentityPlanet(body, false)
  const mobile = createIdentityPlanet(body, true)
  for (const planet of [desktop, mobile]) {
    const surface = planet.group.getObjectByName('identity-surface')
    const clouds = planet.group.getObjectByName('identity-clouds')
    const atmo = planet.group.getObjectByName('identity-atmosphere')
    assert.ok(surface && clouds && atmo)
    assert.ok(atmo.scale.x === 1)
    assert.ok(clouds.geometry.parameters.radius > surface.geometry.parameters.radius)
    assert.ok(atmo.geometry.parameters.radius > clouds.geometry.parameters.radius)
    const sun = atmo.material.uniforms.sunDirection.value
    assert.ok(sun.isVector3)
    const before = [surface.rotation.y, clouds.rotation.y]
    planet.update(.05, true)
    assert.notEqual(surface.rotation.y, before[0])
    assert.notEqual(clouds.rotation.y, before[1])
    const moved = [surface.rotation.y, clouds.rotation.y]
    planet.update(.05, false)
    assert.equal(surface.rotation.y, moved[0])
    assert.equal(clouds.rotation.y, moved[1])
    assert.notEqual(surface.rotation.y, clouds.rotation.y, 'independent cloud and surface clocks')
    planet.dispose()
    const scene = new Scene()
    scene.add(planet.group)
    disposeScene(scene, mockRenderer())
  }
  assert.ok(desktop.group.getObjectByName('identity-moon'))
  assert.equal(mobile.group.getObjectByName('identity-moon'), undefined)
})
