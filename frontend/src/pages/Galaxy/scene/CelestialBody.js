import { AdditiveBlending, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, ShaderMaterial, SphereGeometry } from 'three'
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
export function createSun(body, lowPower) {
  const style = SUN_APPEARANCE, group = new Group(), segments = lowPower ? 32 : 48
  let targetActivity = 0
  const material = new ShaderMaterial({
    defines: { SUN_OCTAVES: lowPower ? 2 : 3 },
    uniforms: {
      time: { value: 0 }, activity: { value: 0 },
      amber: { value: new Color(style.amber) }, gold: { value: new Color(style.gold) }, ivory: { value: new Color(style.ivory) },
    },
    vertexShader: `
      varying vec3 surface; varying vec3 n; varying vec3 eye;
      void main() {
        surface = normalize(position);
        vec4 v = modelViewMatrix * vec4(position, 1.);
        n = normalize(normalMatrix * normal); eye = -v.xyz;
        gl_Position = projectionMatrix * v;
      }
    `,
    fragmentShader: `
      uniform float time; uniform float activity;
      uniform vec3 amber; uniform vec3 gold; uniform vec3 ivory;
      varying vec3 surface; varying vec3 n; varying vec3 eye;
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
        vec3 p = normalize(surface) * 4.8;
        p += .28 * sin(p.yzx * 1.6 + time * .08);
        p += vec3(time * .035, -time * .018, 0.);
        float field = 0., amplitude = .57;
        for (int i = 0; i < SUN_OCTAVES; i++) {
          field += amplitude * noise(p);
          p = p.yzx * 2.03 + vec3(3.1, 1.7, 4.2); amplitude *= .48;
        }
        float facing = max(dot(normalize(n), normalize(eye)), 0.);
        float filaments = smoothstep(.39, .72, field);
        vec3 color = mix(amber, gold, .44 + .4 * facing);
        color = mix(color, ivory, filaments * (.48 + .04 * activity));
        color += gold * pow(1. - facing, 3.) * .065;
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const surface = new Mesh(new SphereGeometry(body.radius, segments, segments / 2), material)
  surface.name = 'core-surface'
  group.add(surface)
  const corona = shell(body.radius * style.innerScale, style.corona, style.innerStrength, segments)
  corona.name = 'core-corona'
  group.add(corona)
  const outer = lowPower ? null : shell(body.radius * style.outerScale, style.outerCorona, style.outerStrength, segments)
  if (outer) { outer.name = 'core-outer-corona'; group.add(outer) }
  function present(activity) {
    material.uniforms.activity.value = activity
    corona.material.uniforms.strength.value = style.innerStrength * (1 + activity * style.coronaBoost)
    if (outer) outer.material.uniforms.strength.value = style.outerStrength * (1 + activity * style.coronaBoost)
  }
  return {
    group,
    setInteraction(hovered, selected, instant = false) {
      targetActivity = selected ? style.focusActivity : hovered ? style.hoverActivity : 0
      if (instant) present(targetActivity)
    },
    update(delta, animate = true) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
      let activity = material.uniforms.activity.value + (targetActivity - material.uniforms.activity.value) * (1 - Math.exp(-dt * 6))
      if (Math.abs(activity - targetActivity) < .0001) activity = targetActivity
      present(activity)
      if (animate) material.uniforms.time.value = (material.uniforms.time.value + dt * (1 + activity * .3)) % 10000
    },
  }
}
export function createCelestialBody(body, lowPower) {
  const group = new Group(), segments = lowPower ? 24 : 40
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
    if (body.surface === 'rock') {
      const r = 1 + grain * 0.035
      positions.setXYZ(i, positions.getX(i) * r, positions.getY(i) * r, positions.getZ(i) * r)
    }
    const color = accent.clone().lerp(base, pattern)
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: body.surface === 'engineered' ? 0.4 : 0.85, metalness: body.surface === 'engineered' ? 0.48 : 0.04 })
  group.add(new Mesh(geometry, material))
  if (body.surface === 'ocean') group.add(shell(body.radius * 1.05, '#6bc3ba', 0.28, segments))
  if (body.ring) {
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
