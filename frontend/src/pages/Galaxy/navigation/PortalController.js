// G2R.8A: pure, host-agnostic cinematic portal lifecycle.
// The scene owns the motion; the full-screen overlay must explicitly confirm
// it has painted an opaque blackout before any route commit can occur.
export const PORTAL_PHASES = Object.freeze({
  IDLE: 'idle',
  APPROACH: 'approach',
  PLUNGE: 'plunge',
  BLACKOUT: 'blackout',
  COMMITTED: 'committed',
})

export const PORTAL_TIMING = Object.freeze({
  approach: .9,
  plunge: 1.3,
})

// Destinations are application-local absolute paths, not arbitrary external
// URLs. The first portal goes to /; /lab can be configured in a later phase.
export function validatePortalDestination(destination) {
  if (typeof destination !== 'string'
    || !/^\/[a-z0-9/_-]*$/i.test(destination)
    || destination.startsWith('//')) {
    throw new TypeError('The portal destination must be a local pathname')
  }
  return destination
}

const frozen = next => Object.freeze(next)
export function createPortalController({ destination = '/', onCommit = () => {} } = {}) {
  const pathname = validatePortalDestination(destination)
  if (typeof onCommit !== 'function') throw new TypeError('onCommit must be a function')
  const listeners = new Set()
  let phaseElapsed = 0
  let generation = 0
  let reducedMotion = false
  let state = frozen({ mode: PORTAL_PHASES.IDLE, transitionId: generation, destination: pathname })

  function publish(mode) {
    if (mode === state.mode && generation === state.transitionId) return
    state = frozen({ mode, transitionId: generation, destination: pathname })
    listeners.forEach(listener => listener())
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getMotion() {
      if (state.mode === PORTAL_PHASES.APPROACH) {
        return { mode: state.mode, progress: Math.min(1, phaseElapsed / PORTAL_TIMING.approach) }
      }
      if (state.mode === PORTAL_PHASES.PLUNGE) {
        return { mode: state.mode, progress: Math.min(1, phaseElapsed / PORTAL_TIMING.plunge) }
      }
      return { mode: state.mode, progress: state.mode === PORTAL_PHASES.IDLE ? 0 : 1 }
    },
    begin(selection, navigationMode, { reduceMotion = false } = {}) {
      if (state.mode !== PORTAL_PHASES.IDLE
        || selection !== 'black-hole' || navigationMode !== 'body_focused') return false
      reducedMotion = Boolean(reduceMotion)
      phaseElapsed = 0
      generation += 1
      publish(reducedMotion ? PORTAL_PHASES.BLACKOUT : PORTAL_PHASES.APPROACH)
      return true
    },
    advance(delta) {
      if (!Number.isFinite(delta) || delta <= 0) return state.mode
      let remaining = Math.min(delta, .05)
      while (remaining > 0) {
        const duration = state.mode === PORTAL_PHASES.APPROACH ? PORTAL_TIMING.approach
          : state.mode === PORTAL_PHASES.PLUNGE ? PORTAL_TIMING.plunge : 0
        if (!duration) break
        const step = Math.min(remaining, duration - phaseElapsed)
        phaseElapsed += step
        remaining -= step
        if (phaseElapsed + 1e-8 >= duration) {
          phaseElapsed = 0
          publish(state.mode === PORTAL_PHASES.APPROACH
            ? PORTAL_PHASES.PLUNGE : PORTAL_PHASES.BLACKOUT)
        }
      }
      return state.mode
    },
    cancel() {
      if (state.mode === PORTAL_PHASES.IDLE || state.mode === PORTAL_PHASES.COMMITTED) return false
      phaseElapsed = 0
      generation += 1 // Invalidate a previously scheduled blackout acknowledgement.
      publish(PORTAL_PHASES.IDLE)
      return true
    },
    confirmBlackout(transitionId, opaque = false) {
      if (state.mode !== PORTAL_PHASES.BLACKOUT || transitionId !== generation || opaque !== true) return false
      publish(PORTAL_PHASES.COMMITTED)
      onCommit(pathname)
      return true
    },
  }
}
