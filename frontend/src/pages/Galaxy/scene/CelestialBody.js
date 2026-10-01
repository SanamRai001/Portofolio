import { AdditiveBlending, ClampToEdgeWrapping, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, CatmullRomCurve3, RepeatWrapping, RingGeometry, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader, TubeGeometry, Vector3 } from 'three'
import { SUN_APPEARANCE } from '../data/core.js'

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
function createProminences(radius, style) {
  const group = new Group()
  group.name = 'core-prominences'

  // The hero Core camera currently approaches from this local-space
  // direction. Build sparse arches around its limb instead of scattering
  // arbitrary loops around the sphere and hoping they happen to be visible.
  const view = new Vector3(.226, .644, .731).normalize()
  const right = new Vector3(0, 1, 0).cross(view).normalize()
  const up = view.clone().cross(right).normalize()
  const pointOnLimb = (angle, distance, viewBias = 0) => right.clone()
    .multiplyScalar(Math.cos(angle))
    .addScaledVector(up, Math.sin(angle))
    .addScaledVector(view, viewBias)
    .normalize()
    .multiplyScalar(distance)

  const loops = [
    { angle: .72, span: .17, height: 1.34, width: .014, phase: .3 },
    { angle: 2.58, span: .14, height: 1.27, width: .011, phase: 2.1 },
    { angle: 4.38, span: .11, height: 1.21, width: .009, phase: 4.2 },
  ]
  for (const [index, loop] of loops.entries()) {
    const start = pointOnLimb(loop.angle - loop.span, radius * 1.003, .055)
    const end = pointOnLimb(loop.angle + loop.span, radius * 1.003, .055)
    const apex = pointOnLimb(loop.angle, radius * loop.height, .08)
    const curve = new CatmullRomCurve3([start, apex, end], false, 'centripetal')
    const material = new MeshBasicMaterial({
      color: style.prominence,
      transparent: true,
      opacity: style.prominenceOpacity,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      toneMapped: false,
    })
    material.userData.baseOpacity = style.prominenceOpacity
    material.userData.phase = loop.phase
    const mesh = new Mesh(new TubeGeometry(curve, 24, radius * loop.width, 4, false), material)
    mesh.name = `core-prominence-${index + 1}`
    mesh.renderOrder = 3
    group.add(mesh)
  }
  return group
}
export function createSun(body, lowPower, onSurfaceReady = () => {}) {
  const style = SUN_APPEARANCE, group = new Group(), segments = lowPower ? 40 : 64
  let targetActivity = 0
  let disposed = false, loaded = false, texture
  const material = new ShaderMaterial({
    defines: { SUN_OCTAVES: lowPower ? 2 : 3 },
    uniforms: {
      time: { value: 0 }, activity: { value: 0 }, surfaceMap: { value: null }, hasSurfaceMap: { value: false },
      amber: { value: new Color(style.amber) }, gold: { value: new Color(style.gold) }, ivory: { value: new Color(style.ivory) },
    },
    vertexShader: `
      varying vec3 surface; varying vec3 n; varying vec3 eye; varying vec2 surfaceUv;
      void main() {
        surface = normalize(position);
        surfaceUv = uv;
        vec4 v = modelViewMatrix * vec4(position, 1.);
        n = normalize(normalMatrix * normal); eye = -v.xyz;
        gl_Position = projectionMatrix * v;
      }
    `,
    fragmentShader: `
      uniform float time; uniform float activity;
      uniform sampler2D surfaceMap; uniform bool hasSurfaceMap;
      uniform vec3 amber; uniform vec3 gold; uniform vec3 ivory;
      varying vec3 surface; varying vec3 n; varying vec3 eye; varying vec2 surfaceUv;
      float hash(vec3 p) {
        p = fract(p * .1031); p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 p = normalize(surface) * 5.4;
        p += .22 * sin(p.yzx * 1.7 + time * .07);
        p += vec3(time * .028, -time * .014, 0.);
        float field = 0., amplitude = .57;
        for (int i = 0; i < SUN_OCTAVES; i++) {
          field += amplitude * noise(p);
          p = p.yzx * 2.03 + vec3(3.1, 1.7, 4.2); amplitude *= .48;
        }
        float facing = max(dot(normalize(n), normalize(eye)), 0.);
        float filaments = smoothstep(.5, .76, field);
        vec3 color = mix(amber, gold, .4 + .34 * facing);
        color *= .79 + .34 * field;
        #if SUN_OCTAVES > 2
          // Fine-scale value-noise bands keep the authored map from reading
          // like a painted marble and suggest granular convection structure.
          float cells = noise(surface * 29. + vec3(time * .010));
          float granules = noise(surface * 83. + vec3(time * .016));
          float lanes = 1. - smoothstep(.055, .2, abs(cells - .5));
          color *= 1. - lanes * .13 + (cells - .5) * .14 + (granules - .5) * .095;
          color = mix(color, ivory, smoothstep(.68, .9, granules) * .09);
        #endif
        color = mix(color, ivory, filaments * (.18 + .035 * activity));
        if (hasSurfaceMap) {
          // Gently drift the authored photosphere across the sphere. Both
          // sides of the longitude join resolve to the same blended texel.
          float u = fract(surfaceUv.x + time * .00155);
          vec3 detail = texture2D(surfaceMap, vec2(u, surfaceUv.y)).rgb;
          float edge = min(u, 1. - u);
          if (edge < .025) {
            vec3 opposite = texture2D(surfaceMap, vec2(1. - u, surfaceUv.y)).rgb;
            detail = mix(detail, opposite, .5 * (1. - smoothstep(0., .025, edge)));
          }
          // The authored equirectangular map has visible compression at
          // the poles. Fade it there and let the procedural photosphere own
          // those regions instead of preserving a texture-mapping artifact.
          float latitudeMask = smoothstep(.08, .22, surfaceUv.y)
            * (1. - smoothstep(.78, .92, surfaceUv.y));
          float authoredWeight = mix(.16, .54, latitudeMask);
          color = mix(color, detail * (.69 + .22 * facing), authoredWeight);
        }
        // Photosphere limb shaping: preserve a readable bright face while the
        // edge falls warmer/darker before the separate corona shell begins.
        float limb = pow(clamp(facing, 0., 1.), .28);
        color *= mix(.52, 1.04, limb);
        color = mix(color, amber, pow(1. - facing, 2.4) * .16);
        color += gold * pow(1. - facing, 4.) * .025;
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const surface = new Mesh(new SphereGeometry(body.radius, segments, segments / 2), material)
  surface.name = 'core-surface'
  group.add(surface)
  if (typeof document !== 'undefined') {
    const path = lowPower ? '/galaxy/sun-surface-mobile.webp' : '/galaxy/sun-surface.webp'
    texture = new TextureLoader().load(path, (map) => {
      if (disposed) { map.dispose(); return }
      loaded = true
      map.colorSpace = SRGBColorSpace
      map.wrapS = RepeatWrapping
      map.wrapT = ClampToEdgeWrapping
      material.uniforms.surfaceMap.value = map
      material.uniforms.hasSurfaceMap.value = true
      onSurfaceReady()
    }, undefined, () => texture?.dispose())
  }
  const corona = shell(body.radius * style.innerScale, style.corona, style.innerStrength, segments)
  corona.name = 'core-corona'
  group.add(corona)
  const outer = lowPower ? null : shell(body.radius * style.outerScale, style.outerCorona, style.outerStrength, segments)
  if (outer) { outer.name = 'core-outer-corona'; group.add(outer) }
  const prominences = lowPower ? null : createProminences(body.radius, style)
  if (prominences) group.add(prominences)
  function present(activity) {
    material.uniforms.activity.value = activity
    corona.material.uniforms.strength.value = style.innerStrength * (1 + activity * style.coronaBoost)
    if (outer) outer.material.uniforms.strength.value = style.outerStrength * (1 + activity * style.coronaBoost)
  }
  function presentProminences(activity, time) {
    if (!prominences) return
    for (const loop of prominences.children) {
      const pulse = .9 + Math.sin(time * .34 + loop.material.userData.phase) * .1
      loop.material.opacity = loop.material.userData.baseOpacity * pulse * (1 + activity * style.prominenceBoost)
    }
  }
  presentProminences(0, 0)
  return {
    group,
    dispose() {
      disposed = true
      // The scene owns the installed texture through the shader uniform.
      if (!loaded) texture?.dispose()
    },
    setInteraction(hovered, selected, instant = false) {
      targetActivity = selected ? style.focusActivity : hovered ? style.hoverActivity : 0
      if (instant) {
        present(targetActivity)
        presentProminences(targetActivity, material.uniforms.time.value)
      }
    },
    update(delta, animate = true) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
      let activity = material.uniforms.activity.value + (targetActivity - material.uniforms.activity.value) * (1 - Math.exp(-dt * 6))
      if (Math.abs(activity - targetActivity) < .0001) activity = targetActivity
      present(activity)
      if (animate) material.uniforms.time.value = (material.uniforms.time.value + dt * (1 + activity * .3)) % 10000
      presentProminences(activity, material.uniforms.time.value)
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
