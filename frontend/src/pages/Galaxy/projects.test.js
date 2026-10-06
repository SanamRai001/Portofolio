import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'

import { PROJECT_NODES, projectById } from './data/projects.js'
import { PLANETS } from './data/solarSystem.js'
import { createNavigationController } from './navigation/NavigationController.js'
import { galaxyInteraction } from './navigation/GalaxyInteraction.js'
import { createProjectsPlanet } from './scene/ProjectsPlanet.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { disposeScene } from './utils/disposeScene.js'

const body = PLANETS.find(candidate => candidate.id === 'projects')
const focused = {
  selectedBodyId: 'projects',
  mode: 'body_focused',
  selectedProjectId: null,
  hoveredProjectId: null,
  selectedSkillId: null,
  hoveredSkillId: null,
}

function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, {
    dispose() {},
    forceContextLoss() {},
    domElement: { remove() {} },
  })
}

test('Projects world contains only curated personal project signals', () => {
  assert.deepEqual(
    PROJECT_NODES.map(project => project.id),
    [
      'reality-archive',
      'statescout',
      'reposcout',
      'eonborne',
      'dear-future',
      'sajilo-business',
    ],
  )
  assert.equal(projectById('statescout').label, 'StateScout')
  assert.equal(projectById('missing'), undefined)
  assert.ok(PROJECT_NODES.every(project => project.href.startsWith('https://github.com/SanamRai001/')))
})

test('project selection stays local and never starts a camera transition', () => {
  const navigation = createNavigationController()
  const input = galaxyInteraction(navigation)

  input.focusBody('project:statescout')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)

  navigation.focusBody('projects')
  input.focusBody('project:statescout')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)

  navigation.complete(navigation.getSnapshot().transitionId)
  const transitionId = navigation.getSnapshot().transitionId

  input.setHover('project:statescout')
  assert.equal(navigation.getSnapshot().hoveredProjectId, 'statescout')

  navigation.setProjectHover('reality-archive', 'keyboard')
  input.setHover(null)
  assert.equal(navigation.getSnapshot().hoveredProjectId, 'reality-archive')

  input.focusBody('project:statescout')
  assert.equal(navigation.getSnapshot().selectedProjectId, 'statescout')
  assert.equal(navigation.getSnapshot().transitionId, transitionId)

  navigation.focusBody('journey')
  assert.equal(navigation.getSnapshot().selectedProjectId, null)
  assert.equal(navigation.getSnapshot().hoveredProjectId, null)
})

test('Projects signals are hidden outside focus and use bounded local clocks', () => {
  const planet = createProjectsPlanet(body, false)
  const initial = planet.simulation.position('statescout')

  assert.equal(planet.hitMeshes.length, 0)
  planet.update(.05)
  assert.deepEqual(planet.simulation.position('statescout'), initial)

  planet.setSelection(focused)
  assert.equal(planet.hitMeshes.length, PROJECT_NODES.length)
  assert.ok(planet.hitMeshes.every(mesh => mesh.layers.mask === 2))

  planet.setSelection({
    ...focused,
    selectedProjectId: 'statescout',
    hoveredProjectId: 'reality-archive',
  })

  for (let i = 0; i < 240; i++) planet.update(.05)

  assert.deepEqual(planet.simulation.position('statescout'), initial)
  assert.ok(Math.abs(planet.simulation.rate('reality-archive') - .42) < .0001)

  for (const project of PROJECT_NODES) {
    const position = planet.nodes.get(project.id).root.position
    assert.ok(position.toArray().every(Number.isFinite))
    assert.ok(Math.abs(position.length() - project.orbit.radius) < 1e-8)
  }

  const frozen = planet.simulation.position('reality-archive')
  planet.update(.05, false)
  planet.update(NaN)
  planet.update(-1)
  assert.deepEqual(planet.simulation.position('reality-archive'), frozen)

  planet.setSelection(focused)
  planet.update(.05)
  assert.notDeepEqual(planet.simulation.position('statescout'), initial)

  planet.setSelection({ ...focused, selectedBodyId: 'identity' })
  assert.equal(planet.hitMeshes.length, 0)
  release(planet.group)
})

test('Projects reuses geometry and lowers local orbit segments on low power', () => {
  const full = createProjectsPlanet(body, false)
  const low = createProjectsPlanet(body, true)
  const constellation = planet => planet.group.getObjectByName('projects-constellation')
  const lines = planet => constellation(planet).children.filter(child => child.isLineLoop)

  assert.equal(lines(full).length, 2)
  assert.equal(lines(low).length, 2)
  assert.ok(lines(low)[0].geometry.attributes.position.count < lines(full)[0].geometry.attributes.position.count)
  assert.equal(
    full.nodes.get('statescout').mesh.geometry,
    full.nodes.get('reality-archive').mesh.geometry,
  )

  for (const planet of [full, low]) {
    const geometries = new Set()
    const materials = new Set()
    planet.group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry)
      if (object.material) materials.add(object.material)
    })
    let geometryDisposals = 0
    let materialDisposals = 0
    geometries.forEach(item => item.addEventListener('dispose', () => geometryDisposals++))
    materials.forEach(item => item.addEventListener('dispose', () => materialDisposals++))
    release(planet.group)
    assert.equal(geometryDisposals, geometries.size)
    assert.equal(materialDisposals, materials.size)
  }
})

test('solar picker exposes only the active local constellation', () => {
  const solar = createSolarSystem({ lowPower: true })

  solar.setInteraction({ ...focused, mode: 'focusing_body' }, true)
  assert.equal(solar.hitMeshes.length, 7)

  solar.setInteraction(focused, true)
  assert.equal(solar.hitMeshes.length, 7 + PROJECT_NODES.length)

  solar.setInteraction({
    ...focused,
    selectedBodyId: 'skills',
    mode: 'body_focused',
  }, true)
  assert.equal(solar.hitMeshes.length, 17, 'Skills keeps its ten existing local targets')

  solar.setInteraction({ ...focused, selectedBodyId: 'core' }, true)
  assert.equal(solar.hitMeshes.length, 7)

  release(solar.group)
})
