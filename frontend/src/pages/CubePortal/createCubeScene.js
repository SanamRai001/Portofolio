import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import modelUrl from '../../../../prototypes/unfolding-cube-portal/assets/stone-cube-canonical.glb?url'

// Only the lid moves; the five walls remain a single solid form.
const LID_TRAVEL = Object.freeze([0, 0.78, -0.20])

function ease(t) { const a = Math.max(0, Math.min(t, 1)); return a * a * (3 - 2 * a) }

/** Owns every WebGL resource and event; no global listeners survive unmount. */
export function createCubeScene(mount, { onReady, onError, mode = 'full' }) {
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

  const ambient = new THREE.HemisphereLight(0xffffff, 0x32363b, 1.1)
  const key = new THREE.DirectionalLight(0xffffff, 2.15)
  key.position.set(4, 7, 6)
  const rim = new THREE.DirectionalLight(0xe7eff7, 1.1)
  rim.position.set(-4, 1, -4)
  const goldAccent = new THREE.PointLight(0xffb767, 0.1, 1.1, 2)
  goldAccent.position.set(.96, .97, .96)
  // A tiny, localized glow at the seam's tip: no full-face amber wash.
  const glintCanvas = document.createElement('canvas')
  glintCanvas.width = glintCanvas.height = 64
  const ctx = glintCanvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,248,217,0.9)')
  gradient.addColorStop(.12, 'rgba(255,203,120,0.7)')
  gradient.addColorStop(.45, 'rgba(255,168,68,0.2)')
  gradient.addColorStop(1, 'rgba(255,168,68,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  const glintTexture = new THREE.CanvasTexture(glintCanvas)
  const glintMaterial = new THREE.SpriteMaterial({
    map: glintTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const glint = new THREE.Sprite(glintMaterial)
  glint.position.set(.985, .986, .985)
  glint.scale.set(.23, .23, 1)
  scene.add(ambient, key, rim, goldAccent, glint)

  const geometryRoot = new THREE.Group()
  scene.add(geometryRoot)
  const panels = []
  const seamMaterials = []
  let gltfRoot = null
  let disposed = false
  let raf = 0
  let progress = 0
  let goal = 0
  let begin = 0
  let from = 0
  let state = { phase: 'home', theme: 'light', reducedMotion: false, highlighted: false }
  let firstFrame = false

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
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null
  observer?.observe(mount)
  window.addEventListener('resize', resize)

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
      item.mesh.rotation.x -= v * 0.28
    }
    geometryRoot.rotation.y = -0.07
    const dark = state.theme === 'dark'
    ambient.intensity = dark ? 0.72 : 1.1
    key.intensity = dark ? 1.75 : 2.15
    rim.intensity = dark ? 1.35 : 1.1
    const active = state.highlighted && state.phase === 'home'
    goldAccent.intensity = (dark ? 0.18 : 0.07) + (active ? 0.16 : 0) + v * 0.24
    glintMaterial.opacity = (dark ? 0.70 : 0.22) * (1 - v) + (active ? 0.22 : 0)
    for (const material of seamMaterials) material.emissiveIntensity = (dark ? 1.35 : 0.90) + (active ? 0.65 : 0) + v * 0.45
    renderer.render(scene, camera)
    if (gltfRoot && !firstFrame) {
      firstFrame = true
      onReady?.()
    }
    if (Math.abs(progress - goal) > 0.001) queueFrame()
  }
  function queueFrame() { if (!disposed && !raf) raf = requestAnimationFrame(draw) }

  const loader = new GLTFLoader()
  loader.load(modelUrl, (gltf) => {
    if (disposed) { disposeScene(gltf.scene); return }
    gltfRoot = gltf.scene
    geometryRoot.add(gltfRoot)
    let shellCount = 0
    gltf.scene.traverse((object) => {
      if (!object.isMesh) return
      if (/^shell_(?:front|right|top|left|back|bottom)$/.test(object.name)) {
        shellCount += 1
        if (mode === 'stone-only') object.visible = false
      }
      object.frustumCulled = false
      const match = /^(?:stone|shell|seam)_(front|right|top|left|back|bottom)$/.exec(object.name)
      if (match?.[1] === 'top') {
        panels.push({ mesh: object, position: object.position.clone(),
          rotation: object.rotation.clone(), direction: new THREE.Vector3(...LID_TRAVEL) })
      }
      if (object.name.startsWith('seam_') && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) {
          material.emissive = new THREE.Color(0xd78d45)
          material.color = new THREE.Color(0x9a6236)
          material.needsUpdate = true
        }
        seamMaterials.push(...materials)
      }
      if (object.name === 'gold_heart' && object.material) {
        object.material.emissive = new THREE.Color(0xffbb69)
        object.material.emissiveIntensity = 1.6
      }
    })
    mount.dataset.shellCount = String(shellCount)
    mount.dataset.hiddenShellCount = String(mode === 'stone-only' ? shellCount : 0)
    mount.dataset.movingPanelCount = String(panels.length)
    resize()
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
      observer?.disconnect()
      window.removeEventListener('resize', resize)
      if (gltfRoot) disposeScene(gltfRoot)
      glintMaterial.dispose()
      glintTexture.dispose()
      delete mount.dataset.shellCount
      delete mount.dataset.hiddenShellCount
      delete mount.dataset.movingPanelCount
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
