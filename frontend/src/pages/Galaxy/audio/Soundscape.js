// G2R.9: original, intentionally quiet, click-to-enable sound design.
// No downloaded recordings, timers, rAF, AudioContext or sound device on import.
export const GALAXY_SOUND_LEVEL = Object.freeze({
  max: .027,
  overview: .44,
  hover: .49,
  focus: .56,
  blackHole: .61,
  approach: .50,
  plunge: .29,
})

export function galaxySoundLevel({ selectedBodyId = null, hoveredBodyId = null, portalMode = 'idle',
  paused = false, hidden = false, staticView = false } = {}) {
  if (paused || hidden || staticView || portalMode === 'blackout' || portalMode === 'committed') return 0
  if (portalMode === 'plunge') return GALAXY_SOUND_LEVEL.plunge
  if (portalMode === 'approach') return GALAXY_SOUND_LEVEL.approach
  if (selectedBodyId === 'black-hole') return GALAXY_SOUND_LEVEL.blackHole
  if (selectedBodyId) return GALAXY_SOUND_LEVEL.focus
  return hoveredBodyId ? GALAXY_SOUND_LEVEL.hover : GALAXY_SOUND_LEVEL.overview
}

export function createGalaxySoundscape({ AudioContextClass = null } = {}) {
  let context = null, master = null, tones = [], enabled = false, serial = 0
  let lastSignals = {}
  let lastFocusedBody = null
  const factory = () => AudioContextClass
    || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
  const ramp = (parameter, value, seconds = .16) => {
    if (!context) return
    parameter.cancelScheduledValues(context.currentTime)
    parameter.setTargetAtTime(value, context.currentTime, seconds)
  }
  function makeGraph() {
    const Context = factory()
    if (!Context) return false
    context = new Context()
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    master = context.createGain()
    master.gain.value = 0
    filter.connect(master)
    master.connect(context.destination)
    for (const [frequency, type, level] of [[110, 'sine', .43], [164.81, 'sine', .18], [220, 'triangle', .075]]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.value = frequency
      gain.gain.value = level
      oscillator.connect(gain)
      gain.connect(filter)
      oscillator.start()
      tones.push({ oscillator, gain })
    }
    return true
  }
  function cue() {
    if (!context || !enabled || context.state !== 'running') return
    // A soft arrival signal, *never* emitted for pointer hover or route load.
    // Nodes end themselves; no setTimeout and no second scene animation clock.
    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(293.66, now)
    oscillator.frequency.exponentialRampToValueAtTime(220, now + .14)
    gain.gain.setValueAtTime(.00001, now)
    gain.gain.exponentialRampToValueAtTime(.004, now + .025)
    gain.gain.exponentialRampToValueAtTime(.00001, now + .19)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    oscillator.start(now)
    oscillator.stop(now + .2)
  }
  function setSignals(signals = {}) {
    lastSignals = signals
    const focused = signals.navigationMode === 'body_focused' ? signals.selectedBodyId : null
    if (enabled && focused && focused !== lastFocusedBody && signals.portalMode === 'idle'
      && !signals.reducedMotion) cue()
    lastFocusedBody = focused
    if (!enabled || !master) return
    const level = galaxySoundLevel(signals)
    ramp(master.gain, GALAXY_SOUND_LEVEL.max * level, signals.portalMode === 'plunge' ? .24 : .18)
    if (tones[1]) ramp(tones[1].oscillator.frequency, signals.selectedBodyId === 'black-hole' ? 155.56 : 164.81, .32)
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
        // Enabling sound while a body is already focused should not fire
        // an unexplained arrival sound.
        lastFocusedBody = lastSignals.navigationMode === 'body_focused'
          ? lastSignals.selectedBodyId : null
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
      for (const { oscillator, gain } of tones) {
        try { oscillator.stop() } catch { /* already stopped */ }
        oscillator.disconnect()
        gain.disconnect()
      }
      tones = []
      master.disconnect()
      context = master = null
      void former.close().catch(() => {})
    },
  }
}
