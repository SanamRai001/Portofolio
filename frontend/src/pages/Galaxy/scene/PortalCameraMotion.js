import { MathUtils, Vector3 } from 'three'
import { BLACK_HOLE } from '../data/solarSystem.js'

// Applies cinematic travel to the EXISTING Galaxy camera after CameraRig
// updates in the sole scene loop. No second camera or animation clock.
export function createPortalCameraMotion(camera, getAnchor) {
  const anchor = new Vector3(), direction = new Vector3(), startingPoint = new Vector3()
  let started = false, startDistance = 0, startingFov = 0
  const closeDistance = Math.max(2.4, BLACK_HOLE.radius * 3.8)
  const eased = progress => {
    const t = MathUtils.clamp(Number.isFinite(progress) ? progress : 0, 0, 1)
    return t * t * (3 - 2 * t)
  }
  function reset() { started = false }
  function apply({ mode, progress }) {
    if (mode === 'idle' || mode === 'committed') { reset(); return false }
    // Reduced-motion users reach blackout without a camera flight. The veil
    // owns their short, accessible fade.
    if (mode === 'blackout' && !started) return false
    getAnchor(BLACK_HOLE.id, anchor)
    if (!started) {
      started = true
      startingPoint.copy(camera.position)
      direction.subVectors(startingPoint, anchor)
      startDistance = direction.length()
      if (startDistance < .01) direction.set(0, .5, 1).normalize()
      else direction.multiplyScalar(1 / startDistance)
      startingFov = camera.fov
    }
    const t = eased(progress)
    const distance = mode === 'approach'
      ? MathUtils.lerp(startDistance, closeDistance, t)
      : mode === 'plunge' ? MathUtils.lerp(closeDistance, .075, t) : .075
    const nextFov = mode === 'approach'
      ? MathUtils.lerp(startingFov, Math.min(55, startingFov + 6), t)
      : mode === 'plunge' ? MathUtils.lerp(Math.min(55, startingFov + 6), 84, t) : 84
    camera.position.copy(anchor).addScaledVector(direction, distance)
    if (Math.abs(camera.fov - nextFov) > 1e-6) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }
    camera.lookAt(anchor)
    return true
  }
  return { apply, reset }
}
