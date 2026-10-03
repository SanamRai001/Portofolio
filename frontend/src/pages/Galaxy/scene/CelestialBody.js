import { AdditiveBlending, ClampToEdgeWrapping, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, RingGeometry, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader } from 'three'
import { SUN_APPEARANCE } from '../data/core.js'
import { GALAXY_TEXTURES } from '../data/photorealAssets.js'
import { createSolarSurfaceMaterial, createSolarCorona, createSolarFilaments } from './SunRealism.js'

function shell(radius, color, strength, segments) {
  return new Mesh(new SphereGeometry(radius, segments, segments / 2), new ShaderMaterial({
    uniforms: { tint: { value: new Color(color) }, strength: { value: strength } },
    vertexShader: `varying vec3 n; varying vec3 eye; void main(){ vec4 p=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); eye=-p.xyz; gl_Position=projectionMatrix*p; }`,
    fragmentShader: `uniform vec3 tint; uniform float strength; varying vec3 n; varying vec3 eye; void main(){ float rim=pow(1.-max(dot(normalize(n),normalize(eye)),0.),3.); gl_FragColor=vec4(tint,rim*strength); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  }))
}
function ring(inner, outer, color, opacity, segments) {
  const mesh = new Mesh(new RingGeometry(inner, outer, segments), new MeshBasicMaterial({ color, side: DoubleSide, transparent: true, opacity, depthWrite: false }))
  mesh.rotation.x = -Math.PI / 2 + 0.3
  mesh.rotation.y = 0.2
  return mesh
}
export function createSun(body, lowPower, onSurfaceReady = () => {}) {
  const style = SUN_APPEARANCE, group = new Group(), segments = lowPower ? 40 : 64
  let targetActivity = 0, disposed = false, loaded = false, texture
  let candidateReleased = false
  function releaseCandidate(map) {
    if (!candidateReleased && map) { candidateReleased = true; map.dispose() }
  }
  const material = createSolarSurfaceMaterial(style, lowPower)
  const surface = new Mesh(new SphereGeometry(body.radius, segments, segments / 2), material)
  surface.name = 'core-surface'
  group.add(surface)

  // Preserve the local legacy asset as faint grayscale micro-variation only.
  // A flat observational solar disk cannot be used as a 360-degree UV globe.
  if (typeof document !== 'undefined') {
    texture = new TextureLoader().load(GALAXY_TEXTURES.sun, map => {
      if (disposed) { releaseCandidate(map); return }
      loaded = true
      map.colorSpace = SRGBColorSpace
      map.wrapS = RepeatWrapping
      map.wrapT = ClampToEdgeWrapping
      material.uniforms.surfaceMap.value = map
      material.uniforms.hasSurfaceMap.value = true
      onSurfaceReady()
    }, undefined, () => releaseCandidate(texture))
  }

  const { inner: corona, outer } = createSolarCorona(body.radius, style, lowPower, segments)
  group.add(corona)
  if (outer) group.add(outer)
  const prominences = lowPower ? null : createSolarFilaments(body.radius, style)
  if (prominences) group.add(prominences)

  function present(activity) {
    material.uniforms.activity.value = activity
    corona.material.uniforms.strength.value = style.innerStrength * (1 + activity * style.coronaBoost)
    if (outer) outer.material.uniforms.strength.value = style.outerStrength * (1 + activity * style.coronaBoost)
  }
  function presentFilaments(activity, time) {
    if (!prominences) return
    for (const filament of prominences.children) {
      filament.material.uniforms.activity.value = activity
      filament.material.uniforms.time.value = time
    }
  }
  return {
    group,
    dispose() {
      disposed = true
      // Successfully installed map belongs to disposeScene() via shader uniform.
      if (!loaded) releaseCandidate(texture)
    },
    setInteraction(hovered, selected, instant = false) {
      targetActivity = selected ? style.focusActivity : hovered ? style.hoverActivity : 0
      if (instant) {
        present(targetActivity)
        presentFilaments(targetActivity, material.uniforms.time.value)
      }
    },
    update(delta, animate = true) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
      let activity = material.uniforms.activity.value + (targetActivity - material.uniforms.activity.value)
        * (1 - Math.exp(-dt * 6))
      if (Math.abs(activity - targetActivity) < .0001) activity = targetActivity
      present(activity)
      if (animate) material.uniforms.time.value = (material.uniforms.time.value + dt * (1 + activity * .08)) % 10000
      presentFilaments(activity, material.uniforms.time.value)
    },
  }
}
export function createCelestialBody(body, lowPower, { smoothRock = false, rings = true } = {}) {
  // The textured Projects body uses its bump map for relief. Coarse vertex
  // displacement pinches the sphere's pole triangles in focused views.
  const group = new Group(), segments = smoothRock ? (lowPower ? 40 : 64) : (lowPower ? 24 : 40)
  const geometry = new SphereGeometry(body.radius, segments, segments / 2)
  const positions = geometry.attributes.position, colors = []
  const base = new Color(body.color), accent = new Color(body.surface === 'ocean' ? '#183840' : '#363945')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) / body.radius, y = positions.getY(i) / body.radius, z = positions.getZ(i) / body.radius
    const grain = Math.sin(x * 19 + Math.sin(z * 11)) * Math.cos(y * 17 - z * 7)
    let pattern = 0.5 + grain * 0.25
    if (body.surface === 'ocean') pattern = 0.35 + 0.45 * Math.max(0, Math.sin(x * 6 + z * 4) * Math.cos(y * 8 + z * 3))
    if (body.surface === 'engineered') pattern = Math.abs(Math.sin(y * 22)) < 0.25 || Math.abs(Math.sin(Math.atan2(z, x) * 10)) < 0.18 ? 0.9 : 0.27
    if (body.surface === 'weathered') pattern = 0.5 + Math.sin(y * 24 + grain) * 0.18
    if (body.surface === 'rock' && !smoothRock) {
      const r = 1 + grain * 0.035
      positions.setXYZ(i, positions.getX(i) * r, positions.getY(i) * r, positions.getZ(i) * r)
    }
    const color = accent.clone().lerp(base, pattern)
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: body.surface === 'engineered' ? 0.4 : 0.85, metalness: body.surface === 'engineered' ? 0.48 : 0.04 })
  const surface = new Mesh(geometry, material)
  surface.name = `${body.id}-surface`
  group.add(surface)
  if (body.surface === 'ocean') group.add(shell(body.radius * 1.05, '#6bc3ba', 0.28, segments))
  if (body.ring && rings) {
    group.add(ring(body.radius * body.ring[0], body.radius * 1.8, '#a998ba', 0.32, 96))
    group.add(ring(body.radius * 1.88, body.radius * body.ring[1], '#8c8299', 0.2, 96))
  }
  return group
}
export function createLab(body) {
  const group = new Group()
  group.add(new Mesh(new SphereGeometry(body.radius, 24, 12), new MeshBasicMaterial({ color: '#06050a' })))
  group.add(ring(body.radius * 1.35, body.radius * 1.6, body.color, 0.48, 64))
  group.add(shell(body.radius * 1.18, body.color, 0.35, 24))
  group.position.fromArray(body.position)
  return group
}

// Shared inexpensive Fresnel shell; no additional rendering loop.
export { shell as createAtmosphere }
