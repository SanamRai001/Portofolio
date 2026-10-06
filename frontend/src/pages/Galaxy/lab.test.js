import test from 'node:test'
import assert from 'node:assert/strict'
import { Scene } from 'three'

import {
  LAB_APPEARANCE,
  LAB_CONTENT,
  LAB_EXPERIMENTS,
  labExperimentById,
} from './data/lab.js'
import { LAB } from './data/solarSystem.js'
import { projectById } from './data/projects.js'
import { galaxyPathForProject } from './navigation/GalaxyHistory.js'
import { createNavigationController } from './navigation/NavigationController.js'
import { createLabBody } from './scene/LabBody.js'
import { createSolarSystem } from './scene/SolarSystem.js'
import { disposeScene } from './utils/disposeScene.js'

function release(group) {
  const scene = new Scene()
  scene.add(group)
  disposeScene(scene, {
    dispose() {},
    forceContextLoss() {},
    domElement: { remove() {} },
  })
}

test('G3F Lab is question-driven research, not a duplicate Projects list', () => {
  assert.equal(LAB_CONTENT.title, 'Questions before products.')
  assert.deepEqual(
    LAB_EXPERIMENTS.map(experiment => experiment.id),
    ['state-space', 'reality-reconstruction', 'vector-reconstruction', 'expressive-small-models'],
  )
  assert.deepEqual(
    LAB_EXPERIMENTS.map(experiment => experiment.evidence),
    ['StateScout', 'Reality Archive', 'ScanSketch', 'Pocket TTS fork'],
  )
  assert.ok(LAB_EXPERIMENTS.every(experiment => experiment.question.endsWith('?')))
  assert.ok(LAB_EXPERIMENTS.every(experiment => experiment.focus.length === 3))
  assert.ok(LAB_EXPERIMENTS.every(experiment =>
    experiment.href.startsWith('https://github.com/SanamRai001/')))
  assert.equal(labExperimentById('missing'), undefined)

  const bridged = LAB_EXPERIMENTS.filter(experiment => experiment.projectId)
  assert.deepEqual(bridged.map(experiment => experiment.projectId), ['statescout', 'reality-archive'])
  for (const experiment of bridged) {
    assert.ok(projectById(experiment.projectId), `${experiment.id} must reference a curated project`)
    assert.equal(
      galaxyPathForProject(experiment.projectId),
      `/galaxy/projects/${experiment.projectId}`,
    )
  }
})

test('Lab experiment selection stays local and clears when leaving Lab', () => {
  const navigation = createNavigationController()

  navigation.selectLab('state-space')
  assert.equal(navigation.getSnapshot().selectedLabId, null)

  navigation.focusBody('lab')
  navigation.selectLab('state-space')
  assert.equal(navigation.getSnapshot().selectedLabId, null)

  navigation.complete(navigation.getSnapshot().transitionId)
  const transitionId = navigation.getSnapshot().transitionId

  navigation.setLabHover('state-space')
  assert.equal(navigation.getSnapshot().hoveredLabId, 'state-space')

  navigation.setLabHover('reality-reconstruction', 'keyboard')
  navigation.setLabHover(null)
  assert.equal(navigation.getSnapshot().hoveredLabId, 'reality-reconstruction')

  navigation.selectLab('state-space')
  assert.equal(navigation.getSnapshot().selectedLabId, 'state-space')
  assert.equal(navigation.getSnapshot().transitionId, transitionId)

  navigation.focusBody('projects')
  assert.equal(navigation.getSnapshot().selectedLabId, null)
  assert.equal(navigation.getSnapshot().hoveredLabId, null)
})

test('Lab reuses its existing core/ring/shell and retunes them to experiment state', () => {
  const presentation = createLabBody(LAB)
  const ring = presentation.group.getObjectByName('lab-scan-ring')
  const shell = presentation.group.getObjectByName('lab-signal-shell')

  assert.ok(presentation.group.getObjectByName('lab-core'))
  assert.equal(presentation.group.children.length, 3)
  assert.equal(ring.material.opacity, LAB_APPEARANCE.ringOpacity)
  assert.equal(shell.material.uniforms.strength.value, LAB_APPEARANCE.shellStrength)

  const focused = {
    selectedBodyId: 'lab',
    mode: 'body_focused',
    selectedLabId: null,
    hoveredLabId: null,
  }
  presentation.setSelection(focused, true)
  assert.equal(ring.material.opacity, LAB_APPEARANCE.focusedRingOpacity)
  assert.equal(shell.material.uniforms.strength.value, LAB_APPEARANCE.focusedShellStrength)

  presentation.setSelection({ ...focused, selectedLabId: 'state-space' }, true)
  assert.equal('#' + ring.material.color.getHexString(), labExperimentById('state-space').color)
  assert.equal('#' + shell.material.uniforms.tint.value.getHexString(), labExperimentById('state-space').color)
  assert.equal(ring.material.opacity, LAB_APPEARANCE.activeRingOpacity)
  assert.equal(shell.material.uniforms.strength.value, LAB_APPEARANCE.activeShellStrength)

  const before = ring.scale.x
  presentation.update(.05, false)
  assert.equal(ring.scale.x, before, 'pause/reduced motion must not advance the scanner pulse')

  presentation.update(.05, true)
  assert.notEqual(ring.scale.x, before)

  presentation.setSelection({ ...focused, selectedBodyId: 'identity' }, true)
  presentation.update(.05, false)
  assert.equal(ring.scale.x, 1)
  assert.equal(ring.material.opacity, LAB_APPEARANCE.ringOpacity)

  release(presentation.group)
})

test('Lab adds no local pick geometry and does not disturb other world hit targets', () => {
  const system = createSolarSystem({ lowPower: true })

  system.setInteraction({
    selectedBodyId: 'lab',
    hoveredBodyId: null,
    mode: 'body_focused',
    selectedLabId: null,
    hoveredLabId: null,
  }, true)
  assert.equal(system.hitMeshes.length, 7, 'Lab selection uses semantic UI, not extra 3D pick meshes')

  system.setInteraction({
    selectedBodyId: 'lab',
    hoveredBodyId: null,
    mode: 'body_focused',
    selectedLabId: 'state-space',
    hoveredLabId: null,
  }, true)
  assert.equal(system.hitMeshes.length, 7)

  system.setInteraction({
    selectedBodyId: 'skills',
    hoveredBodyId: null,
    mode: 'body_focused',
  }, true)
  assert.equal(system.hitMeshes.length, 17)

  system.dispose()
  release(system.group)
})
