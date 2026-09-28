import { ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { createCelestialBody } from './CelestialBody.js'

const desktopSurface = '/galaxy/projects-surface.webp'
const mobileSurface = '/galaxy/projects-surface-mobile.webp'

// Keep the existing procedural planet visible while its original surface asset loads.
// The same light and geometry remain in use after the material receives the map.
export function createProjectsPlanet(body, lowPower, onSurfaceReady = () => {}) {
  const group = createCelestialBody(body, lowPower)
  const surface = group.getObjectByName(`${body.id}-surface`)
  let disposed = false, loaded = false, texture

  if (typeof document !== 'undefined') {
    texture = new TextureLoader().load(lowPower ? mobileSurface : desktopSurface, (map) => {
      if (disposed) { map.dispose(); return }
      loaded = true
      map.colorSpace = SRGBColorSpace
      map.wrapS = RepeatWrapping
      map.wrapT = ClampToEdgeWrapping
      surface.material.vertexColors = false
      surface.material.map = map
      surface.material.bumpMap = map
      surface.material.bumpScale = body.radius * .009
      surface.material.roughness = .94
      surface.material.metalness = .03
      surface.material.needsUpdate = true
      onSurfaceReady()
    }, undefined, () => {
      // The procedural surface is a complete fallback if the asset cannot load.
      texture?.dispose()
    })
  }

  return {
    group,
    update(delta, animate = true) {
      if (animate && Number.isFinite(delta)) surface.rotation.y = (surface.rotation.y + Math.max(0, Math.min(delta, .05)) * body.spin) % (Math.PI * 2)
    },
    dispose() {
      disposed = true
      // Once installed, disposeScene owns this material's texture.
      if (!loaded) texture?.dispose()
    },
  }
}
