import { BufferGeometry, Float32BufferAttribute, Group, Points, ShaderMaterial } from 'three'
import { seededRandom } from '../utils/random.js'

export function createStarField(profile) {
  const group = new Group()
  const random = seededRandom(2709)
  profile.starCounts.forEach((count, layer) => {
    const positions = [], brightness = [], sizes = []
    for (let i = 0; i < count; i += 1) {
      const radius = 85 + layer * 80 + random() * 50
      const theta = random() * Math.PI * 2
      const elevation = Math.acos(2 * random() - 1)
      positions.push(radius * Math.sin(elevation) * Math.cos(theta),
        radius * Math.cos(elevation), radius * Math.sin(elevation) * Math.sin(theta))
      brightness.push(0.25 + random() ** 3 * 0.7)
      sizes.push((layer === 0 ? 2.5 : 1.3) + random() * 1.3)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('brightness', new Float32BufferAttribute(brightness, 1))
    geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
    const material = new ShaderMaterial({
      uniforms: { dpr: { value: profile.dpr } },
      vertexShader: `
        attribute float brightness;
        attribute float size;
        uniform float dpr;
        varying float vBrightness;
        void main() {
          vBrightness = brightness;
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = size * dpr;
        }
      `,
      fragmentShader: `
        varying float vBrightness;
        void main() {
          float distanceToCenter = length(gl_PointCoord - vec2(0.5));
          float alpha = (1.0 - smoothstep(0.06, 0.5, distanceToCenter)) * vBrightness;
          gl_FragColor = vec4(vec3(0.89, 0.91, 0.96), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
    group.add(new Points(geometry, material))
  })
  return {
    group,
    update(delta) {
      group.rotation.y += delta * 0.0012
    },
  }
}
