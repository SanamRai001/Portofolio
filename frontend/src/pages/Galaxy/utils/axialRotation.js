const TAU = Math.PI * 2

function normalizedAngle(value) {
  const angle = value % TAU
  return angle < 0 ? angle + TAU : angle
}

export function createAxialRotation(target, config = {}) {
  const axialTilt = Number.isFinite(config.axialTilt) ? config.axialTilt : 0
  const surfaceSpeed = Number.isFinite(config.surfaceSpeed) ? Math.max(0, config.surfaceSpeed) : 0
  const direction = config.direction === -1 ? -1 : 1
  let angle = normalizedAngle(Number.isFinite(config.phase) ? config.phase : target.rotation.y)

  target.rotation.z = axialTilt
  target.rotation.y = angle

  return {
    get angle() { return angle },
    update(delta, animate = true, rate = 1) {
      if (!animate || !Number.isFinite(delta) || delta < 0) return angle
      const dt = Math.min(delta, .05)
      const safeRate = Number.isFinite(rate) ? Math.max(0, rate) : 1
      angle = normalizedAngle(angle + dt * surfaceSpeed * direction * safeRate)
      target.rotation.y = angle
      return angle
    },
  }
}
