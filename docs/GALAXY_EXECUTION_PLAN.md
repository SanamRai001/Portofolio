# Galaxy remaining work and execution plan
_Last reviewed: 2026-10-04. Repository: `SanamRai001/Portofolio`, production branch `master`._

## Current release baseline

- G1 foundation and G2 solar-system structure are implemented.
- Earth / Identity: photographic NASA Blue/Black Marble and atlas-based atmosphere, merged previously.
- Sun / Core: G2R.12 visible-light-reference photosphere, merged PR #8, merge `eb679bd9`.
- Saturn / Journey: G2R.13 Cassini-inspired translucent C/B/A rings and projected shadow, merged PR #9, current production base `18fa02b7`. The historical `PROJECT_STATE.md` sections saying those PRs are still draft describe earlier snapshots, **not** current branch status.
- The Mars/Projects G2R.14 work was discussed but **has not been implemented/merged** as of this audit. Existing Mars still uses the local 2K atlas, albedo-derived bump and fictional orange settlement/night-light layer.
- Mercury/Skills still uses the original local 2K atlas and basic standard material. Both are valid renderers, but not yet at the Earth/Sun/Saturn realism bar.

## G2R.M verification evidence (2026-10-04; owner visual review pending)

- Final rendering/capture code SHA: `52318d3de197c82b46e845b1e76a59488ce2be7e`.
- Frontend auth/Galaxy/homepage/lint/build: [run 37209474045](https://github.com/SanamRai001/Portofolio/actions/runs/37209474045) **passed** (earlier motion-test run [37209337192](https://github.com/SanamRai001/Portofolio/actions/runs/37209337192) also passed). The new test inspects each rendered planet root after 12 seconds along sampled orbit LineLoop vertices, each signed axial rotation, focus-lock/continued spin, hover rate, and reduced/paused freezing.
- [Galaxy Visual Capture run 37209471446](https://github.com/SanamRai001/Portofolio/actions/runs/37209471446) **passed**, artifact `11306191033`: all six desktop/laptop/phone and normal/reduced Galaxy capture results show zero recorded errors, as do four portal regression scenarios. New `desktop/phone-overview-motion-after-12s.png` are taken with the **same unfocused camera** as their starting `overview-normal.png` frames; actual screenshots were compared, and each primary planet's position changes along the corresponding visible orbit. Contrast is clearly improved on both screen sizes without adding any geometry. Before/after comparison sheets are available in this conversation, not committed to the source tree.
- New line settings: single 128-segment LineLoop per planet, no new GPU mesh; colour `#91aabd` and overview/selected/muted opacity `.49/.56/.25`. Existing artistic surface/revolution speeds were not changed. A selected planet deliberately stops *revolving* for a steady focus shot, while its surface keeps rotating.
- Browser captures are a visual/functional smoke gate, **not** real-device FPS/touch measurements. Feature PR #12 stays separate from `master` until visual signoff. After screenshot acceptance, restore the temporary visual-workflow branch trigger to exactly the master blob so workflow changes do not ship.

## Motion audit: actual wiring, not guesses

The visible paths and revolutions share `utils/orbits.js`: the path is sampled from `orbitPosition(body.orbit, angle)` into one `LineLoop` for every primary planet in `scene/SolarSystem.js`. `createOrbitSimulation` advances each phase independently. `SolarSystem.update(delta, animate)` advances the simulation and writes its coordinates to each planetary **root/group**; `createAxialRotation` in each Planet module spins the **surface mesh** independently. WebGL rendering itself does not disable either system.

| Body / portfolio section | Surface rotation (rad/s) | Revolution (rad/s) | Behaviour |
|---|---:|---:|---|
| Earth / Identity | .022 | .035 | cloud layer rotates independently; Moon desktop only |
| Mercury / Skills | .014 | .024 | skill satellites appear only on Skills focus |
| Mars / Projects | .045 | .017 | existing fictional night layer is surface-locked |
| Saturn / Journey | .009, negative direction | .011 | axial rings remain fixed while cloud top spins |

These are **art-direction speeds, not astronomical periods**. At existing settings, a planet takes much longer to make one complete turn/orbit than an eight-second screenshot interval. Saturn's almost longitude-symmetric bands and independent rings make its own slow surface rotation especially difficult to perceive in a short clip.

Critical interaction rules:
- **Overview:** all four roots revolve and all four surfaces spin in normal motion.
- **Hover:** that planet's orbit eases toward 45% speed; surface spin remains active.
- **Focus:** the selected planet's revolution eases to 0 so the focus camera stays locked to it. Its own surface **continues spinning**; all other planet roots continue revolving. This is intentional, not a broken orbit.
- **Pause motion or OS reduced motion:** scene `animate=false`, so all root revolution, axial spin and animated shaders freeze. Offscreen/hidden tabs stop the render loop to save battery. Still view also does not imply active animation.
- **Sun/Core:** time-driven photosphere shader rather than a rotating physical texture sphere.

Possible causes of the visual report: very low line contrast, 1px platform/WebGL line width, a focus-locked planet, slow configured radian rates, nearly symmetric Saturn texture, or reduced-motion preference. Do not mistake an unchanged *focused screen position* for an unchanged overview world position.

## Ordered implementation

### G2R.M — Orbit clarity and motion verification (current feature branch)

- Branch `feat/galaxy-motion-orbit-audit` from production `18fa02b7`. Keep Mars improvements out of this change.
- `data/solarSystem.js`: improve single-pass line colour/overview alpha without making decorative neon hoops; separate selected/muted levels.
- `scene/SolarSystem.js`: name all orbit loops for inspection; use explicit overview/selected/muted opacity, keep depth testing and `depthWrite:false`; do **not** add expensive tube geometry to mobile.
- `motionOrbitAudit.test.js`: check rendered root positions actually travel each body's sampled loop over 12 seconds; check signed axial spin for all four; focused root settles without stopping surface rotation or other revolutions; hover and pause/reduced-motion gates. Capture initial and 12-second **unfocused overview** desktop/phone screenshots in `scripts/capture-galaxy.mjs` because selected/following-camera screenshots cannot prove revolution.
- Accept only when full frontend tests/lint/build and real browser overview/normal/reduced captures pass and orbit lines remain visibly readable at 1440px and 390px with no clutter. Physical GPU check remains separate; hosted SwiftShader is not a hardware FPS benchmark.
- If the stronger 1px track is still illegible on an actual low-DPR phone, evaluate a restrained camera-facing ribbon stroke at constant pixel-ish thickness **as a separate measured follow-up**; WebGL `LineBasicMaterial.linewidth` is unreliable on common drivers.

### G2R.14 — Mars / Projects realism (next)

1. Retain the attributed Solar System Scope `/galaxy/photoreal/mars.jpg` atlas and source attribution. Use NASA/JPL natural-colour/reference imagery to tune, not to mislabel the existing atlas as unmodified NASA photography.
2. Remove fictional Earth-like orange settlement emission from the Martian nightside: Mars has a dark terminator. Rework material to emphasize mapped albedo, directional sunlight and low specular/dust response.
3. Do **not** use the colour atlas as a fake elevation map. Add separate verified elevation/bump data only if its provenance, footprint and UV compatibility are established; otherwise keep terrain relief subtle/shader-only.
4. Keep a thin daylight dust/atmosphere edge on desktop; mobile stays lean. Preserve existing Projects route/navigation and local JPEG fallback and verify the longitude seam.
5. Gate on unit and actual loaded-asset HTTP checks, 1440px/390px focused start/+8s, overview, no blank canvas or portal regression.

### G2R.15 — Mercury / Skills realism

1. Examine mapped Mercury texture colour/crater fidelity against NASA MESSENGER references, use real crater/height data only when provenance is checked.
2. Improve lit/terminator side without glossy metal-like surface; keep smooth spherical silhouette and no fake rough vertex displacement at poles.
3. Keep interactive Skills constellation nodes, hit areas and orbital speed separate from the planet's axial spin.
4. Check high/low tiers, focus screenshot legibility, asset HTTP 200, motion and resource disposal.

### G2R.16 — Full scene integration and realism coherence

- Match the visual standard across Sun, Earth, Mercury, Mars and Saturn; confirm Sun-based lighting direction, terminators, believable relative scale and coherent colour.
- Check line/planet contrast at desktop/phone, Sun glare, overlap with labels, hovered/selected states, animation control and keyboard/touch semantics.
- Verify all four roots orbit accurately without phase jumping after pause, hover, focus, return from focus, background/foreground and resize; verify each globe rotates in the expected direction.
- Consider an **optional** user-visible simulation-speed setting *only after* collecting real 12s overview/planet captures. Do not silently multiply configured physical-looking rates.

### G2R.17 — Production release gate

- Run `cd frontend; npm ci; npm run test:auth-runtime; npm run test:galaxy; npm run test:homepage; npm run lint; npm run build`.
- Run the Galaxy Playwright visual workflow in browser (desktop 1440×900, laptop 1280×800, phone 390×844; reduced and normal motion, focused/overview). Check every configured external-looking **local** atlas returns 200 with correct content-type.
- Check black-hole portal handoff, pauses, offscreen CPU behaviour, fallback/no-WebGL mode, keyboard, touch, contrast and navigation.
- Compare physical GPU/touch performance on a low-power phone and laptop before claiming “optimized” across all devices.
- Only merge a feature PR after screenshot acceptance; verify the **merge SHA** with frontend CI and Vercel; check live `/galaxy` and update this plan/status.

## Repeatable manual QA

1. Open `/galaxy` with OS reduced-motion off, select **Overview**, keep the browser tab visible. Compare screenshots at 0 and 12 seconds. The planet centres should move on their orbit curves (Saturn moves least).
2. Focus **Earth**, watch its texture/clouds change while its position remains camera-locked; look back at Overview and confirm its revolution resumes without snapping.
3. Hover **Mercury/Skills**: its revolution slows rather than teleports; move pointer out to resume.
4. Focus **Mars** and **Saturn** for 8–20 seconds; their textures move slowly, Saturn's ring plane remains stationary by design.
5. Toggle **Pause motion**; both root positions and surface longitude freeze. Repeat using the OS reduced-motion preference (when enabled, do not expect animation).
6. Inspect each orbit track against the black starfield at overview and when another body is focused; verify no strong opaque white loops or labels obscured by geometry.
7. Review `artifacts/galaxy-visual/{desktop,phone}-overview-normal.png` versus `{desktop,phone}-overview-motion-after-12s.png` from the motion-audit workflow.

## Explicit non-goals

No full navigation rewrite, second animation loop, additional project moons, astronomy-grade periods/scale, global bloom or GPU-heavy particle orbits in this audit. These can be considered separately after the G2 realism release gate.
