import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGalaxySoundscape,
  galaxySoundLevel,
  galaxyWorldTuning,
  GALAXY_SOUND_LEVEL,
  GALAXY_WORLD_TUNING,
} from './audio/Soundscape.js'

class AudioParameterStub {
  constructor(value = 0) {
    this.value = value
    this.events = []
  }
  cancelScheduledValues(time) { this.events.push(['cancel', time]) }
  setTargetAtTime(value, time, duration) {
    this.value = value
    this.events.push(['target', value, time, duration])
  }
  setValueAtTime(value, time) {
    this.value = value
    this.events.push(['set', value, time])
  }
  exponentialRampToValueAtTime(value, time) {
    this.value = value
    this.events.push(['ramp', value, time])
  }
}

class AudioNodeStub {
  constructor() {
    this.connected = []
    this.disconnected = false
  }
  connect(other) {
    this.connected.push(other)
    return other
  }
  disconnect() { this.disconnected = true }
}

class OscillatorStub extends AudioNodeStub {
  constructor() {
    super()
    this.frequency = new AudioParameterStub()
    this.detune = new AudioParameterStub()
    this.started = false
    this.stopped = false
    this.type = null
    this.onended = null
  }
  start() { this.started = true }
  stop() { this.stopped = true }
}

class GainStub extends AudioNodeStub {
  constructor() {
    super()
    this.gain = new AudioParameterStub()
  }
}

class FilterStub extends AudioNodeStub {
  constructor() {
    super()
    this.frequency = new AudioParameterStub()
    this.type = null
  }
}

class AudioContextStub {
  static instances = []

  constructor() {
    this.state = 'suspended'
    this.currentTime = 12
    this.destination = {}
    this.oscillators = []
    this.gains = []
    this.filters = []
    this.resumeCalls = 0
    AudioContextStub.instances.push(this)
  }

  createBiquadFilter() {
    const node = new FilterStub()
    this.filters.push(node)
    return node
  }

  createGain() {
    const node = new GainStub()
    this.gains.push(node)
    return node
  }

  createOscillator() {
    const node = new OscillatorStub()
    this.oscillators.push(node)
    return node
  }

  async resume() {
    this.resumeCalls++
    this.state = 'running'
  }

  async suspend() { this.state = 'suspended' }
  async close() { this.state = 'closed' }
}

test('cinematic ambience stays dormant until the first deliberate interaction', async () => {
  AudioContextStub.instances.length = 0
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })

  sound.setSignals({
    selectedBodyId: 'journey',
    navigationMode: 'body_focused',
  })

  assert.equal(sound.enabled, false)
  assert.equal(sound.created, false)
  assert.equal(AudioContextStub.instances.length, 0)

  assert.equal(await sound.enable(), true)
  assert.equal(sound.enabled, true)
  assert.equal(AudioContextStub.instances.length, 1)

  const ctx = AudioContextStub.instances[0]
  assert.equal(ctx.state, 'running')
  assert.equal(ctx.resumeCalls, 1)
  assert.equal(ctx.oscillators.length, 5, 'five continuous cinematic voices')
  assert.equal(ctx.filters.length, 2, 'dark tone filter plus high-presence rolloff')
  assert.equal(ctx.gains.length, 7, 'body bus, master and five voice gains')
  assert.ok(ctx.oscillators.every(node => node.started))
  assert.ok(ctx.gains[1].gain.value <= GALAXY_SOUND_LEVEL.max)

  assert.equal(await sound.enable(), true)
  assert.equal(AudioContextStub.instances.length, 1, 'repeat interaction reuses one context')

  sound.dispose()
  assert.equal(ctx.state, 'closed')
  assert.ok(ctx.oscillators.slice(0, 5).every(node => node.stopped && node.disconnected))
  assert.ok(ctx.gains.slice(0, 7).every(node => node.disconnected))
  assert.equal(sound.enabled, false)
  assert.equal(sound.created, false)
})

test('each Galaxy world retunes the same ambient bed instead of spawning tracks', async () => {
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })
  assert.equal(await sound.enable(), true)

  const ctx = AudioContextStub.instances.at(-1)
  const master = ctx.gains[1].gain
  const fundamental = ctx.oscillators[1]

  sound.setSignals({
    hoveredBodyId: 'skills',
    portalMode: 'idle',
    navigationMode: 'overview',
  })
  assert.equal(ctx.oscillators.length, 5, 'hover never creates a discrete cue')
  assert.equal(fundamental.frequency.value, GALAXY_WORLD_TUNING.skills.root)
  assert.equal(ctx.filters[0].frequency.value, GALAXY_WORLD_TUNING.skills.color)
  assert.equal(
    master.value,
    GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.hover,
  )

  sound.setSignals({
    selectedBodyId: 'projects',
    navigationMode: 'body_focused',
    portalMode: 'idle',
  })
  assert.equal(ctx.oscillators.length, 6, 'arrival adds one self-ending bloom')
  assert.equal(fundamental.frequency.value, GALAXY_WORLD_TUNING.projects.root)

  sound.setSignals({
    selectedBodyId: 'black-hole',
    navigationMode: 'body_focused',
    portalMode: 'idle',
  })
  assert.equal(ctx.oscillators.length, 7, 'Black Hole arrival has one darker bloom')
  assert.equal(fundamental.frequency.value, GALAXY_WORLD_TUNING['black-hole'].root)
  assert.equal(
    master.value,
    GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.blackHole,
  )

  sound.setSignals({
    selectedBodyId: 'black-hole',
    navigationMode: 'body_focused',
    portalMode: 'approach',
  })
  assert.ok(
    fundamental.frequency.value < GALAXY_WORLD_TUNING['black-hole'].root,
    'horizon approach lowers the bed',
  )

  sound.setSignals({
    selectedBodyId: 'black-hole',
    navigationMode: 'body_focused',
    portalMode: 'plunge',
  })
  assert.equal(ctx.filters[0].frequency.value, 190)
  assert.ok(fundamental.frequency.value < GALAXY_WORLD_TUNING['black-hole'].root * .7)
  assert.equal(
    master.value,
    GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.plunge,
  )

  sound.setSignals({
    selectedBodyId: 'black-hole',
    navigationMode: 'body_focused',
    portalMode: 'blackout',
  })
  assert.equal(master.value, 0, 'blackout is absolute silence before navigation')

  sound.dispose()
})

test('world tuning is deterministic and unknown signals fall back safely', () => {
  assert.equal(galaxyWorldTuning('core'), GALAXY_WORLD_TUNING.core)
  assert.equal(galaxyWorldTuning('lab'), GALAXY_WORLD_TUNING.lab)
  assert.equal(galaxyWorldTuning('unknown').root, 73.42)
  assert.ok(Object.values(GALAXY_WORLD_TUNING).every(tuning =>
    tuning.root > 40 && tuning.root < 110
    && tuning.color >= 300
    && tuning.color <= 1000
  ))
})

test('ambience is bounded and silent in non-present states', () => {
  const live = { selectedBodyId: 'journey', navigationMode: 'body_focused' }

  for (const state of [
    { paused: true },
    { hidden: true },
    { staticView: true },
    { portalMode: 'blackout' },
    { portalMode: 'committed' },
  ]) {
    assert.equal(galaxySoundLevel({ ...live, ...state }), 0)
  }

  assert.ok(galaxySoundLevel(live) > 0)
  assert.ok(
    galaxySoundLevel({ portalMode: 'plunge' })
      < galaxySoundLevel({ portalMode: 'approach' }),
  )
  assert.ok(GALAXY_SOUND_LEVEL.max <= .04)
  assert.ok(
    Object.values(GALAXY_SOUND_LEVEL)
      .filter(Number.isFinite)
      .every(value => value >= 0 && value < 1),
  )
})

test('hidden-tab mute can be reused without leaking contexts', async () => {
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })
  await sound.enable()

  const context = AudioContextStub.instances.at(-1)
  sound.disable()

  assert.equal(sound.enabled, false)
  assert.equal(context.gains[1].gain.value, 0)
  assert.equal(context.state, 'suspended')

  await sound.enable()
  assert.equal(sound.enabled, true)
  assert.equal(AudioContextStub.instances.at(-1), context)

  sound.dispose()
  assert.equal(context.state, 'closed')

  await sound.enable()
  assert.equal(sound.enabled, true)
  assert.notEqual(AudioContextStub.instances.at(-1), context)

  sound.dispose()
})

test('unsupported browsers remain silent and functional', async () => {
  const sound = createGalaxySoundscape()
  assert.equal(await sound.enable(), false)
  assert.equal(sound.enabled, false)
  assert.equal(sound.created, false)
  sound.disable()
  sound.dispose()
})

test('reduced motion suppresses arrival blooms while keeping the quiet bed available', async () => {
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })
  await sound.enable()

  const context = AudioContextStub.instances.at(-1)
  sound.setSignals({
    navigationMode: 'body_focused',
    selectedBodyId: 'identity',
    reducedMotion: true,
  })

  assert.equal(context.oscillators.length, 5)
  assert.equal(
    context.gains[1].gain.value,
    GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.focus,
  )

  sound.dispose()
})
