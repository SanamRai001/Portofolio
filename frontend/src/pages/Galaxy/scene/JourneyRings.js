import {
  Color, DoubleSide, Group, Mesh, RingGeometry, ShaderMaterial,
} from 'three'
import { JOURNEY_RING_APPEARANCE } from '../data/journey.js'

// Fictional, reference-informed ring system: B-like dense inner region,
// a dark Cassini-like division with a faint ringlet, and thinner A-like outer
// material. Everything is drawn in ONE transparent mesh so a focused view
// can resolve fine ringlets without a heavy particle simulation.
export function createJourneyRings(body, lowPower) {
  const style = JOURNEY_RING_APPEARANCE
  const inner = body.radius * body.ring[0]
  const outer = body.radius * body.ring[1]
  const material = new ShaderMaterial({
    defines: { RING_DETAIL_HIGH: lowPower ? 0 : 1 },
    uniforms: {
      innerRadius: { value: inner },
      outerRadius: { value: outer },
      planetRadius: { value: body.radius },
      innerTint: { value: new Color(style.innerTint) },
      outerTint: { value: new Color(style.outerTint) },
    },
    vertexShader: `
      varying float vRadius;
      varying vec2 vDisk;
      varying vec3 vWorldPosition;
      varying vec3 vPlanetCenter;
      varying vec3 vRingNormal;
      void main() {
        vDisk = position.xy;
        vRadius = length(position.xy);
        vec4 world = modelMatrix * vec4(position, 1.);
        vWorldPosition = world.xyz;
        vPlanetCenter = (modelMatrix * vec4(0., 0., 0., 1.)).xyz;
        vRingNormal = normalize(mat3(modelMatrix) * vec3(0., 0., 1.));
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float innerRadius;
      uniform float outerRadius;
      uniform float planetRadius;
      uniform vec3 innerTint;
      uniform vec3 outerTint;
      varying float vRadius;
      varying vec2 vDisk;
      varying vec3 vWorldPosition;
      varying vec3 vPlanetCenter;
      varying vec3 vRingNormal;

      float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      void main() {
        float t = clamp((vRadius - innerRadius) / (outerRadius - innerRadius), 0., 1.);
        float inner = smoothstep(.004, .045, t) * (1. - smoothstep(.475, .505, t));
        float outer = smoothstep(.605, .632, t) * (1. - smoothstep(.96, .995, t));
        // The division is a genuine see-through opening, not a dark painted
        // stripe on an opaque disc.
        float division = exp(-pow((t - .554) * 310., 2.)) * .045;
        float broad = .87 + .08 * sin(t * 51. + sin(t * 17.) * 1.4)
                         + .05 * sin(t * 123.);
        float nearDetail = 1. - smoothstep(7., 23., distance(cameraPosition, vPlanetCenter));
        float fine = 1.;
        #if RING_DETAIL_HIGH
          // Derivative filtering keeps high-frequency ringlets from becoming
          // a shimmering/moiresque spinning disc at overview distance.
          float phase = t * 975. + 2. * sin(t * 69.);
          float ringlet = sin(phase);
          float ringletAA = 1. - smoothstep(.45, 1.7, fwidth(phase));
          fine += ringlet * ringletAA * .18 * nearDetail;
          float angular = atan(vDisk.y, vDisk.x);
          float fleck = hash21(floor(vec2(t * 650., angular * 195.)));
          fine += (fleck - .5) * .095 * nearDetail;
          division *= 1. + nearDetail * .5;
        #endif
        float alpha = (inner * (.28 + .16 * smoothstep(.06, .45, t))
          + outer * (.29 + .08 * (1. - t)) + division) * broad * fine;

        vec3 sunDirection = normalize(-vWorldPosition);
        float incidence = abs(dot(normalize(vRingNormal), sunDirection));
        float light = .64 + .36 * sqrt(incidence);
        // Planet shadow on the rings: ray from ring sample toward the Sun
        // must intersect the planet's sphere before reaching the light.
        vec3 towardPlanet = vPlanetCenter - vWorldPosition;
        float rayDistance = dot(towardPlanet, sunDirection);
        float missSquared = dot(towardPlanet, towardPlanet) - rayDistance * rayDistance;
        float shadow = step(0., rayDistance)
          * (1. - smoothstep(planetRadius * planetRadius * .82,
                            planetRadius * planetRadius * 1.13, missSquared));
        vec3 palette = mix(innerTint, outerTint, smoothstep(.49, .66, t));
        palette *= .89 + .075 * sin(t * 55. + .3) + .035 * sin(t * 147.);
        gl_FragColor = vec4(palette * light * (1. - .78 * shadow), clamp(alpha, 0., .68));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    extensions: { derivatives: true },
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  })
  // The single mesh creates no extra particle draw calls, and low power
  // actually uses FEWER triangles than the two original 96-segment discs.
  const geometry = new RingGeometry(
    inner, outer,
    lowPower ? style.mobileSegments : style.desktopSegments,
    lowPower ? 1 : style.desktopRadialSegments,
  )
  const mesh = new Mesh(geometry, material)
  mesh.name = 'journey-ring-bands'
  // A slightly more oblique plane exposes the ring's ellipse instead of
  // preserving the previous nearly face-on two-hoop silhouette.
  mesh.rotation.x = -Math.PI / 2 - .18
  mesh.rotation.y = .2
  const group = new Group()
  group.name = 'journey-rings'
  group.add(mesh)
  return group
}
