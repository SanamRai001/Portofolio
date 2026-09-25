import { Color, Scene, WebGLRenderer } from 'three'
import { createCameraRig } from './CameraRig.js'
import { createSolarSystem } from './SolarSystem.js'
import { createStarField } from './StarField.js'
import { createRenderLoop } from '../utils/renderLoop.js'
import { disposeScene } from '../utils/disposeScene.js'

export function createGalaxyScene(mount, profile, { onReady, onError }) {
  const scene = new Scene()
  scene.background = new Color('#020204')
  const renderer = new WebGLRenderer({
    antialias: false, alpha: false, powerPreference: profile.lowPower ? 'low-power' : 'default',
  })
  const disposers = []
  let loop, disposed = false
  function dispose() {
    if (disposed) return
    disposed = true
    loop?.dispose()
    disposers.reverse().forEach((cleanup) => cleanup())
    disposeScene(scene, renderer)
  }
  function fail() {
    dispose()
    onError()
  }
  function listen(target, event, callback) {
    target.addEventListener(event, callback)
    disposers.push(() => target.removeEventListener(event, callback))
  }

  try {
    renderer.setPixelRatio(profile.dpr)
    mount.appendChild(renderer.domElement)
    const rig = createCameraRig()
    const stars = createStarField(profile)
    const solar = createSolarSystem(profile)
    scene.add(stars.group, solar.group)
    let paused = false, inView = true, pageActive = true, ready = false

    loop = createRenderLoop({
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (frame) => window.cancelAnimationFrame(frame),
      fps: profile.fps,
      onError: fail,
      render(delta) {
        if (!paused && !profile.reducedMotion) {
          rig.update(delta)
          stars.update(delta)
          solar.update(delta)
        }
        renderer.render(scene, rig.camera)
        if (!ready) { ready = true; onReady() }
      },
    })

    function syncLoop() {
      loop.setState({
        active: inView && pageActive && !document.hidden,
        continuous: !paused && !profile.reducedMotion,
      })
    }
    function resize() {
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      rig.resize(width, height)
      solar.resize(width / height < 0.85)
      renderer.setSize(width, height)
      loop.invalidate()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    disposers.push(() => observer.disconnect())
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      syncLoop()
    })
    visibility.observe(mount)
    disposers.push(() => visibility.disconnect())
    listen(document, 'visibilitychange', syncLoop)
    listen(window, 'pagehide', () => { pageActive = false; syncLoop() })
    listen(window, 'pageshow', () => { pageActive = true; syncLoop() })
    listen(renderer.domElement, 'webglcontextlost', fail)
    if (profile.parallax) {
      listen(mount, 'pointermove', (event) => {
        if (paused || event.pointerType === 'touch') return
        const rect = mount.getBoundingClientRect()
        rig.point((event.clientX - rect.left) / rect.width * 2 - 1,
          1 - (event.clientY - rect.top) / rect.height * 2)
      })
      listen(mount, 'pointerleave', () => rig.point(0, 0))
    }
    resize()
    syncLoop()
    return {
      dispose,
      setPaused(value) {
        paused = value
        if (profile.reducedMotion) rig.reset()
        syncLoop()
      },
    }
  } catch (error) {
    dispose()
    throw error
  }
}
