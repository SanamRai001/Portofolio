// G3B.2: original adaptive procedural Web Audio for the Galaxy.
// No downloaded recordings, no network requests, no timers and no second
// animation loop. The visitor's first real Galaxy gesture unlocks the graph.
export const GALAXY_SOUND_LEVEL = Object.freeze({
  max: .034,
  overview: .36,
  hover: .42,
  focus: .54,
  blackHole: .70,
  approach: .62,
  plunge: .31,
})

export const GALAXY_WORLD_TUNING = Object.freeze({
  core: Object.freeze({ root: 82.41, color: 760, shimmer: 1.50 }),
  identity: Object.freeze({ root: 73.42, color: 650, shimmer: 1.50 }),
  skills: Object.freeze({ root: 98.00, color: 980, shimmer: 1.333 }),
  projects: Object.freeze({ root: 65.41, color: 560, shimmer: 1.50 }),
  journey: Object.freeze({ root: 87.31, color: 820, shimmer: 1.50 }),
  lab: Object.freeze({ root: 61.74, color: 470, shimmer: 1.414 }),
  'black-hole': Object.freeze({ root: 46.25, color: 300, shimmer: 1.189 }),
})

const DEFAULT_TUNING = Object.freeze({ root: 73.42, color: 620, shimmer: 1.50 })

export function galaxySoundLevel({
  selectedBodyId = null,
  hoveredBodyId = null,
  portalMode = 'idle',
  paused = false,
  hidden = false,
  staticView = false,
} = {}) {
  if (
    paused
    || hidden
    || staticView
    || portalMode === 'blackout'
    || portalMode === 'committed'
  ) return 0

  if (portalMode === 'plunge') return GALAXY_SOUND_LEVEL.plunge
  if (portalMode === 'approach') return GALAXY_SOUND_LEVEL.approach
  if (selectedBodyId === 'black-hole') return GALAXY_SOUND_LEVEL.blackHole
  if (selectedBodyId) return GALAXY_SOUND_LEVEL.focus
  return hoveredBodyId ? GALAXY_SOUND_LEVEL.hover : GALAXY_SOUND_LEVEL.overview
}

export function galaxyWorldTuning(bodyId) {
  return GALAXY_WORLD_TUNING[bodyId] || DEFAULT_TUNING
}

export function createGalaxySoundscape({ AudioContextClass = null } = {}) {
  let context = null
  let master = null
  let bodyBus = null
  let lowpass = null
  let presence = null
  let voices = []
  let enabled = false
  let serial = 0
  let lastSignals = {}
  let lastFocusedBody = null

  const factory = () => AudioContextClass
    || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))

  const ramp = (parameter, value, seconds = .22) => {
    if (!context) return
    parameter.cancelScheduledValues(context.currentTime)
    parameter.setTargetAtTime(value, context.currentTime, seconds)
  }

  function makeVoice({ ratio, type, level, detune = 0 }) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.value = DEFAULT_TUNING.root * ratio
    if (oscillator.detune) oscillator.detune.value = detune
    gain.gain.value = level
    oscillator.connect(gain)
    gain.connect(bodyBus)
    oscillator.start()
    const voice = { oscillator, gain, ratio }
    voices.push(voice)
    return voice
  }

  function makeGraph() {
    const Context = factory()
    if (!Context) return false

    context = new Context()

    bodyBus = context.createGain()
    bodyBus.gain.value = 1

    lowpass = context.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = DEFAULT_TUNING.color

    presence = context.createBiquadFilter()
    presence.type = 'lowpass'
    presence.frequency.value = 1750

    master = context.createGain()
    master.gain.value = 0

    bodyBus.connect(lowpass)
    lowpass.connect(presence)
    presence.connect(master)
    master.connect(context.destination)

    // A dark fundamental, a fifth-like layer, a barely-there octave haze,
    // and two high partials create a cinematic bed without sounding musical.
    makeVoice({ ratio: .5, type: 'sine', level: .46, detune: -5 })
    makeVoice({ ratio: 1, type: 'sine', level: .27 })
    makeVoice({ ratio: 1.5, type: 'triangle', level: .12, detune: 4 })
    makeVoice({ ratio: 3, type: 'sine', level: .038, detune: -9 })
    makeVoice({ ratio: 4.01, type: 'triangle', level: .018, detune: 7 })

    return true
  }

  function cue(bodyId) {
    if (!context || !enabled || context.state !== 'running') return

    // One very soft arrival bloom. It is generated only after a deliberate
    // world selection, never on hover or route load.
    const tuning = galaxyWorldTuning(bodyId)
    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = bodyId === 'black-hole' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(
      bodyId === 'black-hole' ? tuning.root * 1.25 : tuning.root * 2,
      now,
    )
    oscillator.frequency.exponentialRampToValueAtTime(
      bodyId === 'black-hole' ? tuning.root * .72 : tuning.root * 1.5,
      now + .42,
    )

    gain.gain.setValueAtTime(.00001, now)
    gain.gain.exponentialRampToValueAtTime(
      bodyId === 'black-hole' ? .0065 : .0034,
      now + .035,
    )
    gain.gain.exponentialRampToValueAtTime(.00001, now + .48)

    oscillator.connect(gain)
    gain.connect(master)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
    oscillator.start(now)
    oscillator.stop(now + .5)
  }

  function retune(signals = {}) {
    if (!context || !bodyBus || !lowpass || !presence) return

    const targetId = signals.selectedBodyId || signals.hoveredBodyId || null
    const tuning = galaxyWorldTuning(targetId)
    const portal = signals.portalMode || 'idle'
    const blackHole = targetId === 'black-hole'

    voices.forEach(({ oscillator, ratio }, index) => {
      let frequency = tuning.root * ratio

      if (blackHole && portal === 'approach') frequency *= index < 2 ? .86 : .92
      if (blackHole && portal === 'plunge') frequency *= index < 2 ? .64 : .78

      ramp(
        oscillator.frequency,
        Math.max(18, frequency),
        blackHole ? .42 : .55,
      )
    })

    ramp(
      lowpass.frequency,
      portal === 'plunge' ? 190 : tuning.color,
      blackHole ? .35 : .65,
    )
    ramp(
      presence.frequency,
      blackHole ? 980 : 1750 * tuning.shimmer,
      .7,
    )
    ramp(
      bodyBus.gain,
      portal === 'plunge' ? .78 : 1,
      .4,
    )
  }

  function setSignals(signals = {}) {
    lastSignals = signals

    const focused = signals.navigationMode === 'body_focused'
      ? signals.selectedBodyId
      : null

    if (
      enabled
      && focused
      && focused !== lastFocusedBody
      && signals.portalMode === 'idle'
      && !signals.reducedMotion
    ) cue(focused)

    lastFocusedBody = focused

    if (!enabled || !master) return

    retune(signals)

    const level = galaxySoundLevel(signals)
    ramp(
      master.gain,
      GALAXY_SOUND_LEVEL.max * level,
      signals.portalMode === 'plunge' ? .28 : .34,
    )
  }

  return {
    get enabled() { return enabled },
    get created() { return Boolean(context) },
    setSignals,

    async enable() {
      if (enabled) return true
      const attempt = ++serial

      try {
        if (!context && !makeGraph()) return false
        if (context.state !== 'running') await context.resume()
        if (serial !== attempt || context.state !== 'running') return false

        enabled = true
        lastFocusedBody = lastSignals.navigationMode === 'body_focused'
          ? lastSignals.selectedBodyId
          : null
        setSignals(lastSignals)
        return true
      } catch {
        enabled = false
        if (master && context) master.gain.value = 0
        return false
      }
    },

    disable() {
      ++serial
      enabled = false
      if (!context) return

      master.gain.cancelScheduledValues(context.currentTime)
      master.gain.setValueAtTime(0, context.currentTime)
      if (context.state === 'running') void context.suspend().catch(() => {})
    },

    dispose() {
      ++serial
      enabled = false
      if (!context) return

      const former = context
      master.gain.cancelScheduledValues(former.currentTime)
      master.gain.value = 0

      for (const { oscillator, gain } of voices) {
        try { oscillator.stop() } catch { /* already stopped */ }
        oscillator.disconnect()
        gain.disconnect()
      }

      voices = []
      bodyBus.disconnect()
      lowpass.disconnect()
      presence.disconnect()
      master.disconnect()

      context = master = bodyBus = lowpass = presence = null
      void former.close().catch(() => {})
    },
  }
}
