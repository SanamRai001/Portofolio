import { Color, Raycaster, Scene, Vector2, WebGLRenderer } from 'three'
import { createCameraRig } from './CameraRig.js'
import { createSolarSystem } from './SolarSystem.js'
import { createStarField } from './StarField.js'
import { createRenderLoop } from '../utils/renderLoop.js'
import { attachPointerInteractions } from '../navigation/InteractionController.js'
import { disposeScene } from '../utils/disposeScene.js'

export function createGalaxyScene(mount, profile, { onReady, onError, navigation }) {
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
    const stars = createStarField(profile)
    const solar = createSolarSystem(profile)
    const rig = createCameraRig({ getAnchor: solar.getAnchor, onComplete: navigation.complete, reducedMotion: profile.reducedMotion })
    scene.add(stars.group, solar.group)
    let paused = false, inView = true, pageActive = true, ready = false

    let interaction
    loop = createRenderLoop({
      requestFrame: (callback) => window.requestAnimationFrame(callback),
      cancelFrame: (frame) => window.cancelAnimationFrame(frame),
      fps: profile.fps,
      onError: fail,
      render(delta) {
        const animate = !paused && !profile.reducedMotion
        solar.update(delta, animate)
        if (animate) stars.update(delta)
        // Navigation works even while ambient/orbital motion is paused.
        rig.update(delta)
        interaction?.refreshHover()
        renderer.render(scene, rig.camera)
        if (!ready) { ready = true; onReady() }
      },
    })

    function syncLoop() {
      loop.setState({
        active: inView && pageActive && !document.hidden,
        continuous: (!paused && !profile.reducedMotion) || rig.travelling,
      })
    }
    function resize() {
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      rig.resize(width, height, window.innerWidth)
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
    const raycaster = new Raycaster(), pointer = new Vector2()
    raycaster.layers.set(1)
    interaction = attachPointerInteractions(mount, {
      navigation, invalidate: () => loop.invalidate(),
      pick(x, y) {
        const rect = mount.getBoundingClientRect()
        if (!rect.width || !rect.height) return null
        pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2)
        solar.group.updateMatrixWorld(true)
        rig.camera.updateMatrixWorld()
        raycaster.setFromCamera(pointer, rig.camera)
        return raycaster.intersectObjects(solar.hitMeshes, false)[0]?.object.userData.bodyId || null
      },
      onPoint(point) {
        if (!profile.parallax || paused) return
        const rect = mount.getBoundingClientRect()
        rig.point(point ? (point.x - rect.left) / rect.width * 2 - 1 : 0,
          point ? 1 - (point.y - rect.top) / rect.height * 2 : 0)
      },
    })
    disposers.push(() => interaction.dispose())
    let transitionId = -1
    function syncNavigation() {
      const state = navigation.getSnapshot()
      solar.setInteraction(state, paused || profile.reducedMotion)
      if (state.transitionId !== transitionId) {
        transitionId = state.transitionId
        rig.navigate(state)
      }
      syncLoop()
      loop.invalidate()
    }
    disposers.push(navigation.subscribe(syncNavigation))
    resize()
    syncNavigation()
    return {
      dispose,
      setPaused(value) {
        paused = value
        solar.setInteraction(navigation.getSnapshot(), paused || profile.reducedMotion)
        syncLoop()
      },
    }
  } catch (error) {
    dispose()
    throw error
  }
}
