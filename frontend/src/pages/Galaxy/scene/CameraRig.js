import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { getOverview } from '../utils/overview.js'

// Overview only: no selection, camera travel or content state.
export function createCameraRig() {
  const camera = new PerspectiveCamera(46, 1, 0.1, 650)
  const home = new Vector3(), desired = new Vector3(), target = new Vector3()
  function resize(width, height) {
    const view = getOverview(width, height)
    camera.aspect = width / height
    camera.fov = view.fov
    camera.up.fromArray(view.up)
    home.fromArray(view.direction).multiplyScalar(view.distance)
    desired.copy(home)
    camera.position.copy(home)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
  }
  resize(1280, 800)
  return {
    camera, resize,
    point(x, y) { desired.copy(home).add(new Vector3(MathUtils.clamp(x, -1, 1) * 0.55, MathUtils.clamp(y, -1, 1) * 0.35, 0)) },
    reset() { desired.copy(home); camera.position.copy(home); camera.lookAt(target) },
    update(delta) { camera.position.lerp(desired, 1 - Math.exp(-Math.max(0, delta) * 2.5)); camera.lookAt(target) },
  }
}
