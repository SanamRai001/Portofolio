import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene, SRGBColorSpace } from 'three'
import { PLANETS } from './data/solarSystem.js'
import { JOURNEY_APPEARANCE, JOURNEY_RING_APPEARANCE, JOURNEY_TRAJECTORY, JOURNEY_WAYPOINTS, journeyById } from './data/journey.js'
import { createJourneySurfaceMap } from './utils/journeySurface.js'
import { createJourneyPlanet } from './scene/JourneyPlanet.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { disposeScene } from './utils/disposeScene.js'
import { createNavigationController } from './navigation/NavigationController.js'
import { galaxyInteraction } from './navigation/GalaxyInteraction.js'

const journey = PLANETS.find(body => body.id === 'journey')
function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, { dispose() {}, forceContextLoss() {}, domElement: { remove() {} } })
}


test('G3D Journey waypoints preserve real progression and stay local to Saturn', () => {
  assert.deepEqual(
    JOURNEY_WAYPOINTS.map(waypoint => waypoint.id),
    ['foundation', 'qa', 'backend', 'mih', 'research'],
  )
  assert.match(journeyById('qa').period, /Danfe Solution/)
  assert.match(journeyById('mih').period, /MIH Group/)
  assert.match(journeyById('research').focus.join(' '), /StateScout/)
  assert.equal(journeyById('missing'), undefined)

  const navigation = createNavigationController()
  const input = galaxyInteraction(navigation)

  input.focusBody('journey:qa')
  assert.equal(navigation.getSnapshot().selectedJourneyId, null)

  navigation.focusBody('journey')
  input.focusBody('journey:qa')
  assert.equal(navigation.getSnapshot().selectedJourneyId, null)

  navigation.complete(navigation.getSnapshot().transitionId)
  const transitionId = navigation.getSnapshot().transitionId

  input.setHover('journey:qa')
  assert.equal(navigation.getSnapshot().hoveredJourneyId, 'qa')

  navigation.setJourneyHover('mih', 'keyboard')
  input.setHover(null)
  assert.equal(navigation.getSnapshot().hoveredJourneyId, 'mih')

  input.focusBody('journey:mih')
  assert.equal(navigation.getSnapshot().selectedJourneyId, 'mih')
  assert.equal(navigation.getSnapshot().transitionId, transitionId)

  navigation.focusBody('projects')
  assert.equal(navigation.getSnapshot().selectedJourneyId, null)
  assert.equal(navigation.getSnapshot().hoveredJourneyId, null)
})

test('G3D Journey trajectory is fixed, bounded and only pickable after arrival', () => {
  const high = createJourneyPlanet(journey, false)
  const low = createJourneyPlanet(journey, true)
  const focused = {
    selectedBodyId: 'journey',
    mode: 'body_focused',
    selectedJourneyId: null,
    hoveredJourneyId: null,
  }

  for (const presentation of [high, low]) {
    const trajectory = presentation.group.getObjectByName('journey-trajectory')
    assert.equal(trajectory.visible, false)
    assert.equal(presentation.hitMeshes.length, 0)

    presentation.setSelection(focused)
    assert.equal(trajectory.visible, true)
    assert.equal(presentation.hitMeshes.length, JOURNEY_WAYPOINTS.length)
    assert.ok(presentation.hitMeshes.every(mesh => mesh.layers.mask === 2))

    const before = presentation.nodes.get('mih').root.position.clone()
    presentation.update(.05, true)
    assert.ok(presentation.nodes.get('mih').root.position.distanceTo(before) < 1e-12,
      'career progression markers are fixed, not orbiting satellites')

    for (const waypoint of JOURNEY_WAYPOINTS) {
      const position = presentation.nodes.get(waypoint.id).root.position
      assert.ok(Math.abs(position.length() - JOURNEY_TRAJECTORY.radius) < 1e-8)
    }

    presentation.setSelection({
      ...focused,
      selectedJourneyId: 'mih',
      hoveredJourneyId: 'research',
    })
    assert.ok(presentation.nodes.get('mih').mesh.scale.x > .16)
    assert.ok(presentation.nodes.get('research').mesh.scale.x > .13)

    presentation.setSelection({ ...focused, selectedBodyId: 'identity' })
    assert.equal(trajectory.visible, false)
    assert.equal(presentation.hitMeshes.length, 0)
  }

  const highPath = high.group.getObjectByName('journey-trajectory-path')
  const lowPath = low.group.getObjectByName('journey-trajectory-path')
  assert.equal(highPath.geometry.attributes.position.count, JOURNEY_TRAJECTORY.desktopSegments + 1)
  assert.equal(lowPath.geometry.attributes.position.count, JOURNEY_TRAJECTORY.mobileSegments + 1)
  assert.ok(lowPath.geometry.attributes.position.count < highPath.geometry.attributes.position.count)

  release(high.group)
  release(low.group)
})

test('G3D solar picker exposes Journey waypoints only while Journey is focused', () => {
  const system = createSolarSystem({ lowPower: true })
  const base = {
    selectedBodyId: 'journey',
    hoveredBodyId: null,
    mode: 'focusing_body',
    selectedJourneyId: null,
    hoveredJourneyId: null,
  }

  system.setInteraction(base, true)
  assert.equal(system.hitMeshes.length, 7)

  system.setInteraction({ ...base, mode: 'body_focused' }, true)
  assert.equal(system.hitMeshes.length, 7 + JOURNEY_WAYPOINTS.length)

  system.setInteraction({ ...base, selectedBodyId: 'core', mode: 'body_focused' }, true)
  assert.equal(system.hitMeshes.length, 7)

  system.dispose()
  release(system.group)
})

test('Journey cloud-top map is deterministic, non-flat and has continuous longitude edges', () => {
  const first = createJourneySurfaceMap(192, 96)
  const second = createJourneySurfaceMap(192, 96)
  assert.equal(first.colorSpace, SRGBColorSpace)
  assert.deepEqual(first.image.data, second.image.data)
  const data = first.image.data
  const range = []
  for (let i = 0; i < data.length; i += 4) {
    range.push(data[i])
    assert.equal(data[i + 3], 255)
  }
  assert.ok(Math.max(...range) - Math.min(...range) > 25)
  // Both outer longitude columns sample neighboring points on the sphere.
  for (let row = 0; row < 96; row++) {
    const a = row * 192 * 4, b = a + 191 * 4
    const difference = Math.max(...[0, 1, 2].map(channel => Math.abs(data[a + channel] - data[b + channel])))
    assert.ok(difference < 30, `visible Journey longitude discontinuity at row ${row}`)
  }
  first.dispose()
  second.dispose()
})

test('Journey upgrades its rings by quality tier while haze and surface obey quality/motion', () => {
  const high = createJourneyPlanet(journey, false), low = createJourneyPlanet(journey, true)
  const ringMeshes = group => group.getObjectByName('journey-rings').children
  assert.equal(ringMeshes(high.group).length, 1)
  assert.equal(ringMeshes(low.group).length, 1)
  assert.equal(high.group.children.filter(object => object.geometry?.type === 'RingGeometry').length, 0)
  assert.equal(low.group.children.filter(object => object.geometry?.type === 'RingGeometry').length, 0)
  const fullRing = ringMeshes(high.group)[0], smallRing = ringMeshes(low.group)[0]
  assert.equal(fullRing.name, 'journey-ring-bands')
  assert.equal(fullRing.geometry.type, 'RingGeometry')
  assert.equal(fullRing.geometry.parameters.thetaSegments, JOURNEY_RING_APPEARANCE.desktopSegments)
  assert.equal(fullRing.geometry.parameters.phiSegments, JOURNEY_RING_APPEARANCE.desktopRadialSegments)
  assert.equal(smallRing.geometry.parameters.thetaSegments, JOURNEY_RING_APPEARANCE.mobileSegments)
  assert.equal(smallRing.geometry.parameters.phiSegments, 1)
  assert.equal(fullRing.material.defines.RING_DETAIL_HIGH, 1)
  assert.equal(smallRing.material.defines.RING_DETAIL_HIGH, 0)
  assert.equal(fullRing.material.depthWrite, false)
  assert.equal(fullRing.material.depthTest, true)
  assert.equal(fullRing.material.transparent, true)
  assert.equal(fullRing.material.uniforms.innerRadius.value, journey.radius * journey.ring[0])
  assert.equal(fullRing.material.uniforms.outerRadius.value, journey.radius * journey.ring[1])
  assert.equal(smallRing.geometry.index.count, JOURNEY_RING_APPEARANCE.mobileSegments * 6)
  assert.ok(smallRing.geometry.index.count < 2 * 96 * 6, 'mobile indices stay below the two former 96-segment rings')
  assert.match(fullRing.material.fragmentShader, /float cassiniRinglet = exp\(/)
  assert.match(fullRing.material.fragmentShader, /fwidth\(phase\)/)
  assert.match(fullRing.material.fragmentShader, /planetRadius.*planetRadius/)
  assert.match(fullRing.material.fragmentShader, /nearDetail/)
  assert.match(fullRing.material.vertexShader, /vPlanetCenter/)

  const fullHaze = high.group.getObjectByName('journey-haze')
  const smallHaze = low.group.getObjectByName('journey-haze')
  assert.ok(fullHaze)
  assert.equal(smallHaze, undefined, 'low power retains the gas giant and rings without optional atmosphere geometry')
  assert.equal(fullHaze.material.uniforms.strength.value, JOURNEY_APPEARANCE.hazeStrength)

  const surface = high.group.getObjectByName('journey-surface')
  assert.equal(surface.material.defines.SATURN_HIGH_QUALITY, 1)
  assert.equal(surface.material.uniforms.dayMap.value.image.width, JOURNEY_APPEARANCE.desktopMapSize[0], 'procedural atlas is the valid pre-load fallback')
  assert.equal(surface.rotation.z, journey.rotation.axialTilt)
  const ringsStart = ringMeshes(high.group).map(ring => ring.rotation.y)
  high.update(.05, true)
  assert.ok(surface.rotation.y > 0, 'retrograde rotation wraps to a positive angle')
  assert.deepEqual(ringMeshes(high.group).map(ring => ring.rotation.y), ringsStart, 'surface spin must not drag rings')
  const frozen = surface.rotation.y
  high.update(.05, false)
  assert.equal(surface.rotation.y, frozen)

  for (const presentation of [high, low]) {
    const geometries = new Set(), materials = new Set()
    presentation.group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry)
      if (object.material) materials.add(object.material)
    })
    let freedGeometries = 0, freedMaterials = 0
    geometries.forEach(item => item.addEventListener('dispose', () => freedGeometries++))
    materials.forEach(item => item.addEventListener('dispose', () => freedMaterials++))
    release(presentation.group)
    assert.equal(freedGeometries, geometries.size)
    assert.equal(freedMaterials, materials.size)
  }
})

test('Journey is integrated into the existing one-loop solar presentation', () => {
  const system = createSolarSystem({ lowPower: true })
  const journeyVisuals = system.targets.get('journey').visuals
  assert.equal(journeyVisuals.getObjectByName('journey-haze'), undefined)
  assert.equal(journeyVisuals.children.filter(c => c.geometry?.type === 'RingGeometry').length, 0)
  assert.equal(journeyVisuals.getObjectByName('journey-rings').children.length, 1)
  const journeySurface = journeyVisuals.getObjectByName('journey-surface')
  const before = journeySurface.rotation.y
  system.update(.05, true)
  assert.notEqual(journeySurface.rotation.y, before)
  const after = journeySurface.rotation.y
  system.update(.05, false)
  assert.equal(journeySurface.rotation.y, after)
  system.dispose()
  release(system.group)
})


test('G2R.6 rings remain independent of Journey axial rotation and are released with the scene', () => {
  const high = createJourneyPlanet(journey, false)
  const low = createJourneyPlanet(journey, true)
  const highBand = high.group.getObjectByName('journey-ring-bands')
  const lowBand = low.group.getObjectByName('journey-ring-bands')
  const angles = [highBand.rotation.x, highBand.rotation.y]
  high.update(.05, true)
  low.update(.05, true)
  assert.deepEqual([highBand.rotation.x, highBand.rotation.y], angles)
  assert.deepEqual([lowBand.rotation.x, lowBand.rotation.y], angles)
  assert.notEqual(high.group.getObjectByName('journey-surface').rotation.y, 0)
  assert.notEqual(low.group.getObjectByName('journey-surface').rotation.y, 0)
  for (const presentation of [high, low]) {
    const ring = presentation.group.getObjectByName('journey-ring-bands')
    let freedGeometry = 0, freedMaterial = 0
    ring.geometry.addEventListener('dispose', () => freedGeometry++)
    ring.material.addEventListener('dispose', () => freedMaterial++)
    release(presentation.group)
    assert.equal(freedGeometry, 1)
    assert.equal(freedMaterial, 1)
  }
})
