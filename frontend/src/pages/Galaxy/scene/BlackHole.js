import {
  AdditiveBlending, Color, DoubleSide, Group, Mesh, MeshBasicMaterial,
  RingGeometry, ShaderMaterial, SphereGeometry,
} from 'three'
import { BLACK_HOLE_APPEARANCE as STYLE } from '../data/blackHole.js'

// The dark central sphere writes depth, letting its silhouette occlude the
// far side of the transparent disk while the near side remains visible.
// The high-quality lens shell is only a localized photon-ring *suggestion*;
// no full-frame screen warp, physically accurate ray tracing, or new render loop.
export function createBlackHole(body, lowPower) {
  const group = new Group()
  group.name = 'black-hole-visuals'
  let targetFocus = 0
  const diskMaterial = new ShaderMaterial({
    defines: { BLACK_HOLE_FINE: lowPower ? 0 : 1 },
    uniforms: {
      time: { value: 0 },
      focusStrength: { value: 0 },
      innerRadius: { value: body.radius * STYLE.diskInnerScale },
      outerRadius: { value: body.radius * STYLE.diskOuterScale },
      horizonRadius: { value: body.radius },
      innerColor: { value: new Color(STYLE.innerDisk) },
      outerColor: { value: new Color(STYLE.outerDisk) },
    },
    vertexShader: `
      uniform float innerRadius;
      uniform float outerRadius;
      uniform float horizonRadius;
      varying float vRadius;
      varying vec2 vDisk;
      varying vec3 vPositionW;
      varying vec3 vCenterW;
      varying vec3 vTangentW;
      void main() {
        vec3 p = position;
        vDisk = p.xy;
        vRadius = length(p.xy);
        #if BLACK_HOLE_FINE
          // A slight lifted far-side inner disk suggests lensed material
          // above the horizon; it is a local mesh warp, not sky distortion.
          float farSide = smoothstep(.0, .73, p.y / max(vRadius, .001));
          float innerWeight = 1. - smoothstep(innerRadius, outerRadius, vRadius);
          p.z += farSide * innerWeight * horizonRadius * .38;
        #endif
        vec4 world = modelMatrix * vec4(p, 1.);
        vPositionW = world.xyz;
        vCenterW = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;
        vTangentW = normalize(mat3(modelMatrix) * vec3(-position.y, position.x, 0.));
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float focusStrength;
      uniform float innerRadius;
      uniform float outerRadius;
      uniform vec3 innerColor;
      uniform vec3 outerColor;
      varying float vRadius;
      varying vec2 vDisk;
      varying vec3 vPositionW;
      varying vec3 vCenterW;
      varying vec3 vTangentW;
      void main() {
        float t = clamp((vRadius - innerRadius) / (outerRadius - innerRadius), 0., 1.);
        float angle = atan(vDisk.y, vDisk.x);
        float edge = smoothstep(.015, .09, t) * (1. - smoothstep(.77, .995, t));
        float heat = pow(1. - t, 2.1);
        float broad = .80 + .13 * sin(t * 19. - angle * 3. - time * .15)
                           + .065 * sin(t * 42. + angle * 7. - time * .21);
        float detail = 1.;
        #if BLACK_HOLE_FINE
          float ripple = t * 410. + angle * 5. - time * .20;
          float rippleAA = 1. - smoothstep(.35, 1.65, fwidth(ripple));
          detail += sin(ripple) * rippleAA * .10;
          detail += .035 * sin(angle * 17. + t * 94. - time * .10);
        #endif
        // Orientation-dependent asymmetry: the side whose orbital tangent
        // points toward the camera is subtly brighter (Doppler-like).
        float approach = dot(normalize(vTangentW), normalize(cameraPosition - vPositionW));
        float beaming = clamp(1. + approach * .27, .74, 1.26);
        vec3 emission = mix(outerColor, innerColor, heat);
        emission *= (.65 + .55 * heat) * broad * detail * beaming * mix(.68, 1.14, focusStrength);
        float alpha = edge * (.22 + .38 * heat) * broad * detail * mix(.75, 1.04, focusStrength);
        gl_FragColor = vec4(emission, clamp(alpha, 0., .75));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    extensions: { derivatives: true },
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    depthTest: true,
  })
  const disk = new Mesh(new RingGeometry(
    body.radius * STYLE.diskInnerScale,
    body.radius * STYLE.diskOuterScale,
    lowPower ? STYLE.mobileSegments : STYLE.desktopSegments,
    lowPower ? 1 : STYLE.desktopRadialSegments,
  ), diskMaterial)
  disk.name = 'black-hole-accretion-disk'
  disk.rotation.set(lowPower ? STYLE.mobileTilt : STYLE.diskTilt, STYLE.diskYaw, .12)
  disk.frustumCulled = false
  group.add(disk)

  const horizon = new Mesh(new SphereGeometry(body.radius, lowPower ? 12 : 36, lowPower ? 6 : 20),
    new MeshBasicMaterial({ color: STYLE.horizon, depthWrite: true }))
  horizon.name = 'black-hole-event-horizon'
  group.add(horizon)
  let mobileHorizonFocused = false

  if (!lowPower) {
    const lens = new Mesh(new SphereGeometry(body.radius * STYLE.lensScale, 36, 20), new ShaderMaterial({
      uniforms: { tint: { value: new Color(STYLE.lensTint) } },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.);
          vPositionW = world.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform vec3 tint;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        void main() {
          vec3 view = normalize(cameraPosition - vPositionW);
          float rim = pow(1. - abs(dot(normalize(vNormalW), view)), 8.);
          // A localized dim lens arc, rather than a uniform neon ring.
          float side = .58 + .42 * smoothstep(-.8, .8, dot(normalize(vNormalW), vec3(.7, .25, -.4)));
          gl_FragColor = vec4(tint * .72, rim * side * .28);
        }
      `,
      transparent: true, depthWrite: false, depthTest: true,
      blending: AdditiveBlending,
    }))
    lens.name = 'black-hole-photon-halo'
    group.add(lens)
  }
  return {
    group,
    setInteraction(hovered, selected, instant = false) {
      targetFocus = selected ? 1 : hovered ? .2 : 0
      if (instant) diskMaterial.uniforms.focusStrength.value = targetFocus
      // The overview stays below the strict low-power 12k-triangle budget.
      // Refine ONLY the selected horizon: at plunge scale, a 12-segment
      // sphere is visibly polygonal. Release the outgoing GPU geometry
      // immediately; the installed replacement belongs to scene disposal.
      if (lowPower && Boolean(selected) !== mobileHorizonFocused) {
        const previous = horizon.geometry
        horizon.geometry = new SphereGeometry(body.radius, selected ? 40 : 12, selected ? 20 : 6)
        previous.dispose()
        mobileHorizonFocused = Boolean(selected)
      }
    },
    update(delta, animate = true) {
      const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0
      const current = diskMaterial.uniforms.focusStrength.value
      diskMaterial.uniforms.focusStrength.value = current + (targetFocus - current) * (1 - Math.exp(-dt * 5))
      if (animate) diskMaterial.uniforms.time.value = (diskMaterial.uniforms.time.value + dt) % 10000
    },
  }
}
