import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import modelUrl from '../../../../prototypes/unfolding-cube-portal/assets/stone-cube.glb?url'

const PANEL_DIRECTION = Object.freeze({
  front: [0, -0.05, 0.85], right: [0.85, 0, 0], top: [0, 0.85, 0],
  left: [-0.25, 0, 0], back: [0, 0, -0.25], bottom: [0, -0.25, 0],
})

function ease(t) { const a = Math.max(0, Math.min(t, 1)); return a * a * (3 - 2 * a) }

/** Owns every WebGL resource and event; no global listeners survive unmount. */
export function createCubeScene(mount, { onReady, onError }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  } catch (error) {
    onError?.(error)
    return { setState() {}, dispose() {} }
  }
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
  camera.position.set(4.25, 3.35, 5.3)
  camera.lookAt(0, 0, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  mount.appendChild(renderer.domElement)

  const ambient = new THREE.HemisphereLight(0xffffff, 0x4a4d53, 2.05)
  const key = new THREE.DirectionalLight(0xffffff, 3.5)
  key.position.set(4, 7, 6)
  const rim = new THREE.DirectionalLight(0xffd9a4, 2.2)
  rim.position.set(-4, 1, -4)
  scene.add(ambient, key, rim)

  const geometryRoot = new THREE.Group()
  scene.add(geometryRoot)
  const panels = []
  let gltfRoot = null
  let disposed = false
  let raf = 0
  let progress = 0
  let goal = 0
  let begin = 0
  let from = 0
  let state = { phase: 'home', theme: 'light', reducedMotion: false }

  const resize = () => {
    if (disposed) return
    const w = Math.max(1, mount.clientWidth)
    const h = Math.max(1, mount.clientHeight)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w < 360 ? 42 : 35
    camera.updateProjectionMatrix()
    queueFrame()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(mount)

  const draw = (now) => {
    raf = 0
    if (disposed) return
    if (progress !== goal) {
      const t = ease((now - begin) / 780)
      progress = from + (goal - from) * t
      if (t >= 1) progress = goal
    }
    const v = ease(progress)
    for (const item of panels) {
      item.mesh.position.copy(item.position).addScaledVector(item.direction, v)
      item.mesh.rotation.copy(item.rotation)
      if (item.side === 'front') item.mesh.rotation.y += v * 0.11
      if (item.side === 'right') item.mesh.rotation.y -= v * 0.18
      if (item.side === 'top') item.mesh.rotation.x -= v * 0.15
    }
    geometryRoot.rotation.y = -0.07 + v * 0.07
    const dark = state.theme === 'dark'
    ambient.intensity = dark ? 1.2 : 2.05
    key.intensity = dark ? 2.8 : 3.5
    rim.intensity = dark ? 3.9 : 2.2
    renderer.render(scene, camera)
    if (Math.abs(progress - goal) > 0.001) queueFrame()
  }
  function queueFrame() { if (!disposed && !raf) raf = requestAnimationFrame(draw) }

  const loader = new GLTFLoader()
  loader.load(modelUrl, (gltf) => {
    if (disposed) { disposeScene(gltf.scene); return }
    gltfRoot = gltf.scene
    geometryRoot.add(gltfRoot)
    gltf.scene.traverse((object) => {
      if (!object.isMesh) return
      object.frustumCulled = false
      const match = /^(?:stone|shell)_(front|right|top|left|back|bottom)$/.exec(object.name)
      if (match) {
        panels.push({ mesh: object, side: match[1], position: object.position.clone(),
          rotation: object.rotation.clone(), direction: new THREE.Vector3(...PANEL_DIRECTION[match[1]]) })
      }
      if (object.name === 'gold_heart' && object.material) {
        object.material.emissive = new THREE.Color(0xffbb69)
        object.material.emissiveIntensity = 1.6
      }
    })
    resize()
    onReady?.()
  }, undefined, (error) => { if (!disposed) onError?.(error) })

  function disposeScene(root) {
    const materials = new Set(), textures = new Set(), geometries = new Set()
    root.traverse((object) => {
      if (!object.isMesh) return
      if (object.geometry) geometries.add(object.geometry)
      const ms = Array.isArray(object.material) ? object.material : [object.material]
      for (const mat of ms) if (mat) {
        materials.add(mat)
        for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value)
      }
    })
    for (const material of materials) material.dispose()
    for (const texture of textures) texture.dispose()
    for (const geometry of geometries) geometry.dispose()
  }

  return {
    setState(next) {
      if (disposed) return
      state = next
      const desired = next.phase === 'opening' || next.phase === 'work' ? 1 : 0
      if (next.reducedMotion) {
        goal = desired; progress = desired; from = desired
        cancelAnimationFrame(raf); raf = 0
        queueFrame()
      } else if (desired !== goal) {
        from = progress; goal = desired; begin = performance.now()
        queueFrame()
      } else queueFrame()
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      if (gltfRoot) disposeScene(gltfRoot)
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
