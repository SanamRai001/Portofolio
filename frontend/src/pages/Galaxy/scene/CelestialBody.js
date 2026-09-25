import { AdditiveBlending, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, ShaderMaterial, SphereGeometry } from 'three'

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
  const group = new Group(), segments = lowPower ? 32 : 48
  const material = new ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 p; varying vec3 n; varying vec3 eye; void main(){ p=position; vec4 v=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); eye=-v.xyz; gl_Position=projectionMatrix*v; }`,
    fragmentShader: `uniform float time; varying vec3 p; varying vec3 n; varying vec3 eye; void main(){ float grain=sin(p.x*13.+sin(p.y*9.+time*.15))*sin(p.z*11.-time*.1); float facing=max(dot(normalize(n),normalize(eye)),0.); vec3 color=mix(vec3(.83,.34,.08),vec3(1.,.85,.53),.55+.35*facing+.06*grain); gl_FragColor=vec4(color,1.); }`,
  })
  group.add(new Mesh(new SphereGeometry(body.radius, segments, segments / 2), material))
  group.add(shell(body.radius * 1.09, '#f8bb69', 0.45, segments), shell(body.radius * 1.22, '#c78138', 0.12, segments))
  return { group, update(delta) { material.uniforms.time.value = (material.uniforms.time.value + delta) % 10000 } }
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
