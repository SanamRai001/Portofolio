# G2R.13 — Saturn / Journey observational design and implementation

## References and limitations

The existing `frontend/public/galaxy/photoreal/saturn.jpg` is the attributed 2K Solar System Scope / INOVE CC BY 4.0 equirectangular Saturn map. The new globe shader uses that asset for colour. It does **not** treat a Cassini camera projection as a complete 360° texture, and its rings are a visual/optical approximation rather than a particle simulation.

Natural-colour reference photographs and science descriptions:
- NASA/JPL, [Colorful Threads and Shadows / PIA06114](https://www.jpl.nasa.gov/images/pia06114-colorful-threads-and-shadows/): inner C ring translucency, dense B, true Cassini Division and shadows.
- NASA, [Translucent Rings](https://www.nasa.gov/image-article/translucent-rings/): A and C rings allow background and projected shadows to remain partly visible.
- NASA, [Pastel Rings / PIA11478](https://science.nasa.gov/photojournal/pastel-rings/): natural-colour fine gradations in inner-ring transparency.
- NASA/JPL, [Post-Equinox Color / PIA11613](https://www.jpl.nasa.gov/images/pia11613-post-equinox-color/): strong directional ring-plane/planet shadow geometry.

## Rendering contract

- Keep the existing *single Journey ring mesh*. Extend its radial domain from 1.235 to 2.295 globe radii: C (~1.24–1.53), B (~1.53–1.955), transparent Cassini gap (~1.955–2.03), A (~2.03–2.295), and a subtle narrow Encke gap. These are **stylized radii**, not exact measured Saturn scale.
- `scene/SaturnOptics.js` owns the one shared radial density function. The visible rings use its alpha; `scene/SaturnRealism.js` uses that same function to project ring shadow onto the lit planet via ray/ring-plane intersection. The ring shader also projects the globe's silhouette back onto its rings. No arbitrary painted dark band across Saturn.
- The 2K atmospheric atlas is sampled by a gas/cloud-specific shader with directional sunlight, a proper day/night terminator and a tiny high-quality belt modulation. `createJourneySurfaceMap` remains as a deterministic fallback DataTexture until the local authored atlas succeeds; once successfully replaced, fallback texture is disposed.
- Align ring group with Journey's axial tilt while keeping its plane independent of cloud-top rotation. `ringNormalSurface` is updated on the existing Journey frame update (also in reduced-motion), then converted by the surface's current model matrix. Thus the shadow doesn't rotate around with the sampled cloud map.
- Desktop: 192 angular × 5 radial geometry and derivative-filtered fine ringlets; optional faint haze. Phone/low power: 96 angular × 1 radial geometry, no fine-ringlet path or haze. No new RAF, particle swarm, external network texture, package, postprocessing pass, interaction or navigation changes.

## Focus framing acceptance

After inspecting the first high/low capture, Journey was still too small to
resolve the Cassini-like bands in the focused 1440px and 390px view. Reduce
only Journey's focus distance 10 → 8.2 and FOV 42° → 40°. This increases
nominal projected ring height by over 25% while keeping the existing
`CAMERA_CLEARANCE` minimum, other planets and Galaxy layout unchanged.
Check actual browser screenshots: the ellipse must remain within the canvas
and must not cover Journey's label/navigation. First normal-motion **phone**
capture showed a near-contact with Journey's heading (even though the reduced
capture was clear). Add a **mobile-only off-axis composition** in
`JOURNEY_COMPOSITION` (`x: .18`, 42° FOV, .30 height fraction), shifting the
enlarged ring approximately 31 screen pixels to the right within the actual
346px portrait canvas; desktop still uses its unchanged camera destination.
The first +19px capture cleared normal motion but left the reduced-motion ellipse almost touching the heading; +31px provides more deliberate clearance.
Verify both actual phone screenshots before signoff.

## Visual rejection conditions

Reject if C and Cassini regions are as opaque as B; ring becomes a thick solid painted hoop; ring shadow has a fixed unrelated stripe; night side is uniformly illuminated; ring disappears behind a transparent-sorting mistake; rings overlap Journey content on phone; any image fails to load silently; canvas, portal or reduced motion regresses.

Required: actual focused desktop/laptop/phone Journey normal/reduced screenshots, overview and black-hole portal capture, real HTTP 200/JPEG check for Saturn image, frontend Galaxy tests/lint/build. Compare baseline and new at matched size. Host Chromium does not establish physical GPU frame timing or touch performance.
