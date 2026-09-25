import { MathUtils, PerspectiveCamera, Vector3 } from 'three'

// G1 owns overview framing/parallax only. Body travel and selection belong to G3.
export function createCameraRig() {
  const camera = new PerspectiveCamera(52, 1, 0.1, 650)
  const home = new Vector3(0, 0, 28)
  const target = new Vector3()
  const desired = home.clone()
  camera.position.copy(home)

  return {
    camera,
    resize(width, height) {
      camera.aspect = width / height
      camera.fov = width < 768 ? 62 : 52
      camera.updateProjectionMatrix()
    },
    point(x, y) {
      desired.set(home.x + MathUtils.clamp(x, -1, 1) * 1.8,
        home.y + MathUtils.clamp(y, -1, 1) * 1.1, home.z)
    },
    reset() {
      desired.copy(home)
      camera.position.copy(home)
      camera.lookAt(target)
    },
    update(delta) {
      camera.position.lerp(desired, 1 - Math.exp(-delta * 2.5))
      camera.lookAt(target)
    },
  }
}
