const TAU = Math.PI * 2
export function orbitPosition(orbit, angle = orbit.phase) {
  const z = Math.sin(angle) * orbit.radius
  return [Math.cos(angle) * orbit.radius, z * Math.sin(orbit.inclination), z * Math.cos(orbit.inclination)]
}
// Each clock retains its phase when paused. G3 can control a body without a time jump.
export function createOrbitSimulation(bodies) {
  const states = new Map(bodies.map(body => [body.id, { angle: body.orbit.phase, rate: 1, targetRate: 1, paused: false }]))
  return {
    update(delta) {
      if (!Number.isFinite(delta) || delta < 0) return
      for (const body of bodies) {
        const state = states.get(body.id)
        const dt = Math.min(delta, 0.05)
        state.rate += (state.targetRate - state.rate) * (1 - Math.exp(-dt * 7))
        if (Math.abs(state.rate - state.targetRate) < 0.0001) state.rate = state.targetRate
        if (!state.paused) state.angle = (state.angle + Math.min(delta, 0.05) * body.orbit.speed * state.rate) % TAU
      }
    },
    rate(id) { return states.get(id)?.rate },
    position(id) {
      const body = bodies.find(body => body.id === id)
      if (!body) throw new RangeError('Unknown celestial body')
      return orbitPosition(body.orbit, states.get(id).angle)
    },
    setPaused(id, paused) { if (states.has(id)) states.get(id).paused = Boolean(paused) },
    setRate(id, rate) { if (states.has(id) && Number.isFinite(rate)) states.get(id).targetRate = Math.max(0, Math.min(rate, 1)) },
  }
}
