import { BufferGeometry, Float32BufferAttribute, Group, Points, ShaderMaterial, Vector3 } from 'three'
import { seededRandom } from '../utils/random.js'

// Distant stars follow the camera more closely; nearer stars remain anchored
// to the actual world and therefore exhibit stronger geometric parallax.
export const STAR_DEPTH_TIERS = Object.freeze([
  Object.freeze({ name: 'foreground', follow: 0, spin: .00012, baseSize: 2.0, maxSize: 1.35, minimumLight: .18 }),
  Object.freeze({ name: 'middle', follow: .44, spin: -.000045, baseSize: 1.4, maxSize: 1.0, minimumLight: .2 }),
  Object.freeze({ name: 'far', follow: .86, spin: .000018, baseSize: 1.0, maxSize: .75, minimumLight: .14 }),
])

function sampledDirection(random, layer) {
  // A loose, faint concentration of far stars hints at a stellar region
  // without introducing a flat star wallpaper or colorful nebula overlay.
  if (layer === 2 && random() < .16) {
    const longitude = random() * Math.PI * 2
    const latitude = (random() + random() + random() - 1.5) * .20
    const c = Math.cos(latitude)
    // Inclined reference plane rather than a rigid horizontal stripe.
    const x = c * Math.cos(longitude), y = Math.sin(latitude), z = c * Math.sin(longitude)
    return [x, y * .81 - z * .586, y * .586 + z * .81]
  }
  const azimuth = random() * Math.PI * 2
  const y = random() * 2 - 1
  const horizontal = Math.sqrt(Math.max(0, 1 - y * y))
  return [horizontal * Math.cos(azimuth), y, horizontal * Math.sin(azimuth)]
}

export function createStarField(profile) {
  const group = new Group(), random = seededRandom(2709)
  const layers = profile.starCounts.map((count, index) => {
    const tier = STAR_DEPTH_TIERS[index]
    const positions = [], brightness = [], sizes = [], colors = []
    for (let i = 0; i < count; i++) {
      const radius = 85 + index * 80 + random() * 50
      const direction = sampledDirection(random, index)
      positions.push(...direction.map(value => value * radius))
      brightness.push(tier.minimumLight + Math.pow(random(), 3.2) * (index === 2 ? .54 : .65))
      sizes.push(tier.baseSize + random() * tier.maxSize)
      // Most stars are neutral-cool; very few have a warmer/blue tint.
      const temperature = random()
      if (temperature < .035) colors.push(1, .84, .71)
      else if (temperature < .10) colors.push(.76, .85, 1)
      else colors.push(.9, .92, .98)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('brightness', new Float32BufferAttribute(brightness, 1))
    geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
    geometry.setAttribute('starColor', new Float32BufferAttribute(colors, 3))
    const material = new ShaderMaterial({
      uniforms: { dpr: { value: profile.dpr } },
      vertexShader: `
        attribute float brightness;
        attribute float size;
        attribute vec3 starColor;
        uniform float dpr;
        varying float vBrightness;
        varying vec3 vColor;
        void main() {
          vBrightness = brightness;
          vColor = starColor;
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = size * dpr;
        }
      `,
      fragmentShader: `
        varying float vBrightness;
        varying vec3 vColor;
        void main() {
          float distanceToCenter = length(gl_PointCoord - vec2(.5));
          float alpha = (1. - smoothstep(.08, .5, distanceToCenter)) * vBrightness;
          if (alpha < .012) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
    const stars = new Points(geometry, material)
    stars.name = `galaxy-stars-${tier.name}`
    group.add(stars)
    return stars
  })

  return {
    group,
    update(delta, cameraPosition, animate = true) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
      const camera = cameraPosition?.isVector3 ? cameraPosition : null
      for (let index = 0; index < layers.length; index++) {
        const layer = layers[index], tier = STAR_DEPTH_TIERS[index]
        if (animate) layer.rotation.y = (layer.rotation.y + dt * tier.spin) % (2 * Math.PI)
        // Camera-relative translation complements real shell depth. Moving
        // the camera off-axis reveals more motion in near stars than far ones.
        // It is deterministic, allocation-free and still valid when paused.
        if (camera) layer.position.copy(camera).multiplyScalar(tier.follow)
      }
    },
  }
}
