# PROJECT_STATE

## Objective / authorization
Implement **G3 only — Interaction Engine + Camera Navigation**, per the user's attached G3 brief. Continue the existing Galaxy implementation and branch. No G4 content, satellites, moons, project details, timeline or final Lab experience. Do not merge or delete branches.

## Inspected baseline
- Existing branch `feat/galaxy-g1-foundation`, clean at `3e45745`; G2 implementation `1e4ca7`. Master remains `70cb2dc`.
- Inspected G1/G2 route splitting, starfield, Sun/four planets/Lab, config-driven deterministic orbits, portrait framing, reduced motion, fallback and disposal. All baseline frontend tests (27), lint and production build passed before G3. No blocking G2 code regression found.
- G1/G2 GPU/browser visual acceptance was incomplete. User explicitly authorized G3 in the new brief; this does not turn the prior visual gap into a pass.

## Implemented G3
- `navigation/NavigationController.js` owns semantic state: `overview` → `focusing_body` → `body_focused` → `returning_overview`. `focusBody`, `goBack`/`returnToOverview`, hover sources and sequence-checked completion form one shared API. Latest selection replaces the active destination; stale completion events are ignored.
- `CameraRig.js` owns camera, look target, FOV and one 1.3-second eased cubic flight. Every body supplies immutable focus distance/azimuth/elevation/FOV. Destinations continuously sample moving focus anchors; focused views keep tracking. Paths and endpoints remain above a configuration-derived swept-geometry clearance. Overview parallax only applies in overview.
- Each of six bodies has a visual group, separate moving focus anchor and a 1.5× low-poly raycast sphere. Interaction spheres occupy layer 1 and never render through the layer-0 camera. No new visual shaders, postprocessing or textures.
- Orbit clocks retain immutable base speeds and independent phases. Current multiplier eases toward target: normal 1, hovered 0.45, selected 0; selection never teleports a body. Returning releases the selected multiplier. Other orbit lines and HUD buttons dim subtly.
- Desktop hover uses a restrained 2% visual scale increase, pointer cursor and temporary HUD label. Keyboard focus supplies equivalent feedback. No permanent floating labels.
- Pointer controller rejects movement over 9px, long presses, multiple pointers and cancelled gestures. No pointer capture, preventDefault or scroll trapping. Sun and Lab share the same selection API as planets.
- Native system-map buttons expose selection via `aria-pressed`. Tab/Enter/Space use native semantics; Escape and ← System share `goBack`. Return restores map focus when needed. Temporary identifiers only: Core/Sanam Rai, planet number, or locked unknown Lab signal.
- Reduced motion snaps directly without a travel arc or FOV change; orbits remain frozen. Pausing ambient motion still permits navigation. Static/WebGL-error fallback settles the same navigation state, highlights its selected SVG body, and keeps map/return/keyboard controls functional.
- Existing one RAF loop, visibility pause, DPR limits, low-power settings and resource disposal retained. Changed invalidation to avoid resetting continuous elapsed time on pointer updates. All new event subscriptions are removed on disposal; React subscribes only to semantic state.

## Local verification
- **66 tests passed:** 24 Galaxy (13 preserved + 11 new), 6 auth-runtime, 8 homepage DOM, 28 backend. Lint and production build passed; diff whitespace check passed.
- New tests cover stale completion, rapid retargeting, return interruption, hover priority, velocity easing/recovery, camera clearance and finite coordinates over all six targets/multiple orbital phases at three viewport stage sizes, live-anchor tracking, paused/reduced navigation, resize, layer-isolated raycasts, cancelled/multitouch gestures, event cleanup, clock starvation, map/fallback state and repeated HUD mount/unmount.
- Requested viewport equivalents: 1440×900 → 1360×630 stage; 1280×800 → 1200×530 stage; 390×844 → 346×494 stage. Numerical camera checks are not browser layout checks.
- Route bundle guard passed: homepage excludes Galaxy/Three.js/GSAP/Forge. Homepage JS unchanged (~90.18 kB gzip). Galaxy route ~5.33 kB gzip; deferred scene ~136.88 kB gzip (+~1.97 kB over G2). Existing >500 kB scene-chunk warning remains isolated to Galaxy. Low-power geometry remains under 12,000 triangles including invisible hits.

## Visual verification / limits
- Rendered the actual SVG fallback's selected Projects state at all three stage dimensions and visually inspected it: selected marker, body hierarchy, rings and portrait arrangement remain readable. This does not verify browser HUD layout or WebGL.
- Supported local preview starts, but opening `/galaxy` in the available browser fails with `ERR_BLOCKED_BY_CLIENT` before the app loads.
- Prior Vercel previews require sign-in; earlier automatic review rejected Vercel sign-in without explicit authorization. Do not bypass preview protection. Available cloud browser previously reported WebGL disabled.
- Actual GPU shader/rendering, camera-motion feel, target picking on a physical device, full-page 1440×900 / 1280×800 / 390×844 overflow/HUD checks, browser console and route re-entry remain unverified. JSDOM/native semantics and mathematical checks are not substitutes.

## Publication / stop boundary
G3 code is ready to publish on the existing branch; CI/deployment evidence will be recorded after publication. No production merge or backend mutation. **Ready for G4: NO — browser/GPU acceptance remains outstanding.** Do not start G4 without explicit authorization. Preserve the branch: it contains unmerged G2/G3 work.
