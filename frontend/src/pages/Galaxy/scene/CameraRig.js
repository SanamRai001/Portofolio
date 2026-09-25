import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { getOverview } from '../utils/overview.js'
import { SYSTEM_MAP, SOLAR_STYLE } from '../data/solarSystem.js'

const configurations = new Map(SYSTEM_MAP.map(body => [body.id, body]))
// Every control point stays above the swept system, including portrait rings.
// The Bézier convex hull therefore cannot intersect any body or orbital plane.
export const CAMERA_CLEARANCE = Math.max(...SYSTEM_MAP.map(body =>
  (body.orbit ? body.orbit.radius * Math.abs(Math.sin(body.orbit.inclination)) : body.position?.[1] || 0)
  + body.radius * (body.ring?.[1] || 1.6) * SOLAR_STYLE.mobileBodyScale)) + 1.5

export function createCameraRig({ getAnchor = () => null, onComplete = () => {}, reducedMotion = false } = {}) {
  const camera = new PerspectiveCamera(46, 1, 0.1, 650)
  const home = new Vector3(), desired = new Vector3(), target = new Vector3()
  const end = new Vector3(), endTarget = new Vector3(), controlA = new Vector3(), controlB = new Vector3()
  let view, selected = null, transition = null

  function destination() {
    endTarget.set(0, 0, 0)
    end.copy(home)
    let fov = view.fov
    const body = configurations.get(selected)
    if (body) {
      getAnchor(selected, endTarget)
      const { distance, azimuth, elevation } = body.focus
      const d = distance * (body.orbit ? view.bodyScale : 1)
      end.set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)).multiplyScalar(d).add(endTarget)
      end.y = Math.max(end.y, CAMERA_CLEARANCE)
      fov = reducedMotion ? view.fov : body.focus.fov
    }
    return fov
  }
  function begin(id, immediate = false) {
    transition = { id, elapsed: 0, start: camera.position.clone(), target: target.clone(), fov: camera.fov }
    if (reducedMotion || immediate) {
      camera.fov = destination()
      camera.position.copy(end); target.copy(endTarget)
      camera.lookAt(target); camera.updateProjectionMatrix()
      transition = null
      onComplete(id)
    }
  }
  function resize(width, height) {
    if (!(width > 0 && height > 0)) return
    view = getOverview(width, height)
    camera.aspect = width / height
    camera.up.fromArray(view.up)
    home.fromArray(view.direction).multiplyScalar(view.distance)
    desired.copy(home)
    if (transition) begin(transition.id)
    else if (selected) { camera.fov = destination(); camera.position.copy(end); target.copy(endTarget) }
    else { camera.fov = view.fov; camera.position.copy(home); target.set(0, 0, 0) }
    camera.lookAt(target)
    camera.updateProjectionMatrix()
  }
  resize(1280, 800)
  return {
    camera, target, resize,
    get travelling() { return transition !== null },
    navigate(state) {
      selected = state.selectedBodyId
      begin(state.transitionId, state.mode === 'body_focused' || state.mode === 'overview')
    },
    point(x, y) {
      if (!selected && !transition) desired.copy(home).add(new Vector3(MathUtils.clamp(x, -1, 1) * 0.55, MathUtils.clamp(y, -1, 1) * 0.35, 0))
    },
    reset() { if (!selected && !transition) { desired.copy(home); camera.position.copy(home); target.set(0, 0, 0); camera.lookAt(target) } },
    update(delta) {
      const dt = Number.isFinite(delta) ? Math.max(0, delta) : 0
      if (transition) {
        const flight = transition
        flight.elapsed += Math.min(dt, 0.05)
        const t = Math.min(flight.elapsed / 1.3, 1), u = t * t * (3 - 2 * t), v = 1 - u
        const fov = destination()
        const lift = Math.min(8, flight.start.distanceTo(end) * 0.22)
        controlA.copy(flight.start); controlA.y += lift
        controlB.copy(end); controlB.y += lift
        camera.position.copy(flight.start).multiplyScalar(v ** 3)
          .addScaledVector(controlA, 3 * v * v * u).addScaledVector(controlB, 3 * v * u * u).addScaledVector(end, u ** 3)
        target.lerpVectors(flight.target, endTarget, u)
        camera.fov = MathUtils.lerp(flight.fov, fov, u)
        camera.updateProjectionMatrix()
        if (t === 1) { transition = null; desired.copy(home); onComplete(flight.id) }
      } else if (selected) {
        destination(); camera.position.copy(end); target.copy(endTarget)
      } else camera.position.lerp(desired, 1 - Math.exp(-dt * 2.5))
      camera.lookAt(target)
    },
  }
}
