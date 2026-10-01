# Galaxy Journey Rings — G2R.6 Reference and Implementation

Status: implementation checkpoint. The visual acceptance run is tracked in `docs/PROJECT_STATE.md`.

## Reference and provenance

These NASA/JPL observational references inform the *structure* of the original fictional Journey ring shader. No photograph, texture, model, or external binary is copied into the repository.

- NASA Science — Saturn's Rings: https://science.nasa.gov/resource/saturns-rings-2/ — dense main A/B/C regions with the prominent Cassini Division between the B and A rings.
- NASA Science — Translucent Rings: https://science.nasa.gov/photojournal/translucent-rings/ — real ring material is optically translucent; a colored opaque torus or two painted solid discs is inappropriate.
- NASA/JPL — Light Shed on the Division: https://www.jpl.nasa.gov/images/pia11450-light-shed-on-the-division/ — narrow radial structure and a visibly different density distribution on either side of the division.
- NASA Science — New Ringlets in Cassini's Division: https://science.nasa.gov/photojournal/new-rings-for-cassinis-division-2/ — faint material remains in parts of the darker opening.
- NASA/JPL — B Ring Terminus: https://www.jpl.nasa.gov/images/pia09763-b-ring-terminus/ — abrupt gap edges with many smaller brightness variations.

Journey is fictional; none of its scene-unit scales, palette choices, ring boundaries, or shadow intensity claim to be Saturn measurements.

## Implementation

The previous two separate uniformly transparent 96-segment rings in `CelestialBody.js` are opted out only for Journey. `JourneyRings.js` provides one double-sided, transparent `RingGeometry` spanning the existing configured radius range. Its radial fragment function yields:

1. a denser inner band, with wide slow tonal variation;
2. an almost fully transparent Cassini-like division and one faint ringlet;
3. an optically thinner outer band, with a feathered exterior edge;
4. smooth broad density/color transitions at overview distance;
5. close-range, derivative-filtered fine striations and seeded angular material flecks on desktop;
6. sunlight incidence and a localized approximate planet-cast ring shadow.

High quality: 192 angular segments × 5 radial segments, high-detail shader. Low power: 96 × 1, no high-frequency detail; the mobile ring uses 192 triangles instead of the earlier two-ring combined 384. The single mesh does not add any extra animation loop or network texture; ring orientation stays independent of Journey's rotating cloud-top surface.

`ShaderMaterial` uses depth testing with depth writing disabled. This allows existing opaque Journey geometry to occlude the far ring while the near material translucently overlays the body. The ring is more oblique than the original near-face-on hoops. Its numerical resemblance to a thin astronomical particle disk is an illustrative visual effect, not a full particle simulation.

## Acceptance criteria

- All Galaxy/navigation/auth/homepage regressions, lint and build pass without relaxing the low-power scene triangle gate.
- Chromium/SwiftShader compiles both desktop and mobile shader variants without console/page errors.
- Inspect desktop and phone Journey focus, overview, and motion captures; reject persistent moiré, dense opaque solid discs, blown highlights, missing far ring, or excessively circular/flat silhouette.
- Confirm rotation belongs to Journey's cloud-top layer only; rings remain compositionally stable when paused/reduced-motion.
- Preserve system-map clicks, focus composition, route isolation, resource disposal, and native/fallback content.
- A physical-device frame-time/touch review remains a separate release requirement.

G2R.7 (black-hole object) is next, only after G2R.6 visual acceptance. G2R.8 owns portal navigation. No G7 portfolio content is added here.
