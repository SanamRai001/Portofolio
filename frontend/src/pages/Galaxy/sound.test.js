import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGalaxySoundscape, galaxySoundLevel, GALAXY_SOUND_LEVEL,
} from './audio/Soundscape.js'

class AudioParameterStub {
  constructor(value = 0) { this.value = value; this.events = [] }
  cancelScheduledValues(time) { this.events.push(['cancel', time]) }
  setTargetAtTime(value, time, duration) {
    this.value = value
    this.events.push(['target', value, time, duration])
  }
  setValueAtTime(value, time) { this.value = value; this.events.push(['set', value, time]) }
  exponentialRampToValueAtTime(value, time) { this.value = value; this.events.push(['ramp', value, time]) }
}
class AudioNodeStub {
  constructor() { this.connected = []; this.disconnected = false }
  connect(other) { this.connected.push(other); return other }
  disconnect() { this.disconnected = true }
}
class OscillatorStub extends AudioNodeStub {
  constructor() {
    super()
    this.frequency = new AudioParameterStub()
    this.started = false
    this.stopped = false
    this.type = null
  }
  start() { this.started = true }
  stop() { this.stopped = true }
}
class GainStub extends AudioNodeStub { constructor() { super(); this.gain = new AudioParameterStub() } }
class FilterStub extends AudioNodeStub { constructor() { super(); this.frequency = new AudioParameterStub() } }
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
  createBiquadFilter() { const n = new FilterStub(); this.filters.push(n); return n }
  createGain() { const n = new GainStub(); this.gains.push(n); return n }
  createOscillator() { const n = new OscillatorStub(); this.oscillators.push(n); return n }
  async resume() { this.resumeCalls++; this.state = 'running' }
  async suspend() { this.state = 'suspended' }
  async close() { this.state = 'closed' }
}

test('G2R.9 sound begins OFF and creates no AudioContext until a direct opt-in', async () => {
  AudioContextStub.instances.length = 0
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })
  sound.setSignals({ selectedBodyId: 'journey', navigationMode: 'body_focused' })
  assert.equal(sound.enabled, false)
  assert.equal(sound.created, false)
  assert.equal(AudioContextStub.instances.length, 0)
  assert.equal(await sound.enable(), true)
  assert.equal(sound.enabled, true)
  assert.equal(AudioContextStub.instances.length, 1)
  const ctx = AudioContextStub.instances[0]
  assert.equal(ctx.state, 'running')
  assert.equal(ctx.resumeCalls, 1)
  assert.equal(ctx.oscillators.length, 3, 'three continuous voices only')
  assert.equal(ctx.filters.length, 1)
  assert.equal(ctx.gains.length, 4, 'three voice gains and one master gain')
  assert.ok(ctx.oscillators.every(n => n.started))
  assert.ok(ctx.gains[0].gain.value <= GALAXY_SOUND_LEVEL.max)
  assert.equal(await sound.enable(), true)
  assert.equal(AudioContextStub.instances.length, 1, 'no duplicate context on repeated click')
  sound.dispose()
  assert.equal(ctx.state, 'closed')
  assert.ok(ctx.oscillators.every(n => n.stopped && n.disconnected))
  assert.ok(ctx.gains.every(n => n.disconnected))
  assert.equal(sound.enabled, false)
  assert.equal(sound.created, false)
})

test('G2R.9 bounded volume reacts to selection and portal, with no hover-generated cues', async () => {
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })
  assert.equal(await sound.enable(), true)
  const ctx = AudioContextStub.instances.at(-1)
  const master = ctx.gains[0].gain
  assert.equal(master.value, GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.overview)
  sound.setSignals({ hoveredBodyId: 'skills', portalMode: 'idle', navigationMode: 'overview' })
  assert.equal(master.value, GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.hover)
  assert.equal(ctx.oscillators.length, 3)
  sound.setSignals({ selectedBodyId: 'black-hole', navigationMode: 'focusing_body' })
  assert.equal(ctx.oscillators.length, 3)
  sound.setSignals({ selectedBodyId: 'black-hole', navigationMode: 'body_focused', portalMode: 'idle' })
  assert.equal(ctx.oscillators.length, 4, 'one quiet, self-ending arrival cue')
  sound.setSignals({ selectedBodyId: 'black-hole', hoveredBodyId: 'projects', navigationMode: 'body_focused' })
  assert.equal(ctx.oscillators.length, 4, 'no extra note on hover/focus repeat')
  assert.equal(master.value, GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.blackHole)
  sound.setSignals({ selectedBodyId: 'black-hole', portalMode: 'approach', navigationMode: 'body_focused' })
  assert.equal(master.value, GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.approach)
  sound.setSignals({ selectedBodyId: 'black-hole', portalMode: 'plunge', navigationMode: 'body_focused' })
  assert.equal(master.value, GALAXY_SOUND_LEVEL.max * GALAXY_SOUND_LEVEL.plunge)
  sound.setSignals({ selectedBodyId: 'black-hole', portalMode: 'blackout', navigationMode: 'body_focused' })
  assert.equal(master.value, 0, 'complete silence before route commit')
  sound.dispose()
})

test('G2R.9 sound is silent in paused, hidden, fallback and committed states', () => {
  const live = { selectedBodyId: 'journey', navigationMode: 'body_focused' }
  for (const state of [
    { paused: true }, { hidden: true }, { staticView: true },
    { portalMode: 'blackout' }, { portalMode: 'committed' },
  ]) assert.equal(galaxySoundLevel({ ...live, ...state }), 0)
  assert.ok(galaxySoundLevel(live) > 0)
  assert.ok(galaxySoundLevel({ portalMode: 'plunge' }) < galaxySoundLevel({ portalMode: 'approach' }))
  assert.ok(Object.values(GALAXY_SOUND_LEVEL).filter(Number.isFinite).every(value => value >= 0 && value < 1))
})

test('G2R.9 mute suspends and reuse does not leak contexts; dispose permits StrictMode re-entry', async () => {
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })
  await sound.enable()
  const context = AudioContextStub.instances.at(-1)
  sound.disable()
  assert.equal(sound.enabled, false)
  assert.equal(context.gains[0].gain.value, 0)
  assert.equal(context.state, 'suspended')
  await sound.enable()
  assert.equal(sound.enabled, true)
  assert.equal(AudioContextStub.instances.at(-1), context, 'reuse graph after mute')
  sound.dispose()
  assert.equal(context.state, 'closed')
  await sound.enable()
  assert.equal(sound.enabled, true)
  assert.notEqual(AudioContextStub.instances.at(-1), context, 'recreate graph after component effect cleanup')
  sound.dispose()
})

test('G2R.9 unsupported browser silently retains OFF state without a context', async () => {
  const sound = createGalaxySoundscape()
  assert.equal(await sound.enable(), false)
  assert.equal(sound.enabled, false)
  assert.equal(sound.created, false)
  sound.disable()
  sound.dispose()
})

test('G2R.9 reduced-motion focus does not create a sound cue even after opting in', async () => {
  const sound = createGalaxySoundscape({ AudioContextClass: AudioContextStub })
  await sound.enable()
  const context = AudioContextStub.instances.at(-1)
  sound.setSignals({ navigationMode: 'body_focused', selectedBodyId: 'identity', reducedMotion: true })
  assert.equal(context.oscillators.length, 3)
  sound.dispose()
})
