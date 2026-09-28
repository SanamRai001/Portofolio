# PROJECT_STATE

## Objective / authorization
**G6 implemented; G2–G6 merged into `master`**. The repo default branch is named `master`. Current branch `feat/galaxy-cinematic-surface-spike` is a narrow visual experiment requested after the user asked for more convincing planetary realism inspired by MaybeBoudha. Preserve the earlier Galaxy feature branch; do not start G7 or delete branches.
Original Galaxy brief defines G6 as technology satellites, hover labels and selected-skill details. No proficiency percentages. Project moons/details, Journey and final Lab remain deferred.

## Baseline / prior decisions
- Clean local/fetched remote at G5 `5abae95`; G5 code `31b6148`, successful frontend CI `36439003234` and Vercel preview status. At the G6 baseline, master was `70cb2dc` and G2–G5 were unmerged.
- Re-read project state, original G6 scope, existing technology copy, shared navigation/orbit/camera architecture and rendering/fallback integration. G5 baseline: 37 Galaxy tests and lint passed again; prior full verification was 79 tests plus build.
- Browser/GPU acceptance is still incomplete. Supported preview repeatedly fails `ERR_BLOCKED_BY_CLIENT`; automatic approval review rejected protected Vercel account navigation. No bypass/sign-in. User explicitly authorizes G6 despite that unresolved visual gate; do not relabel prior checks passed.

## Completed phase — Skills content / selection
- Structured `data/skills.js` owns ten signals: Node.js, TypeScript, Express, React, MySQL, PostgreSQL, MongoDB, Architecture, Git/GitHub and Testing. Grounded in `TechStack.jsx`, existing project examples and repository tests/workflows; no invented experience levels.
- Concise role/focus details, semantic native-button directory, single live details region, keyboard/pointer hover and selected feedback. No logo wall or percentage bars.
- Shared navigation now owns Skills-local hover/selection. Selection is valid only after Skills arrival, does not change camera transition ID and resets on retarget/return. Escape and native return controls preserve map focus. Core/Identity behavior remains intact.
- Content uses existing arrival gating, stacked mobile flow and reduced-motion reveal. Geometry and satellite orbit configuration are separate from rendering.
- Content verification: 39 Galaxy tests and lint passed, including all ten selections, unchanged camera transition, arrival gating, rapid retarget, fallback return and unmount/reentry. Production build and homepage route isolation passed.

## Completed phase — Satellite rendering / fallback
- Preserved the metallic engineered Skills body. Ten small artificial satellites share one box geometry, with three thin inclined orbital paths. Satellites appear and become pickable only after Skills arrival, keeping the overview uncluttered.
- Reuses `createOrbitSimulation` and the existing single frame loop: independent deterministic clocks, selected node paused, hovered node slowed to 35%, reduced motion/pause frozen, hidden constellation clocks suspended. Leaving clears selection feedback and removes local hit targets immediately.
- Pointer/touch input uses the existing tap/drag cancellation controller through a small adapter. Satellite selection does not retarget the camera. Native 48px-minimum controls provide all signals even when a node is occluded or too small to tap comfortably.
- Generic focus `frameRadius` fits the whole constellation; no separate camera. Desktop stays left of content, mobile uses a larger apparent constellation in the existing 320px upper region. Semantic content scrolls normally below.
- Static fallback consumes the same orbit/node data, supports satellite clicks and the same native controls/details, and highlights hover/selection without permanent floating labels. HUD identifies a signal's Skills/category context.
- Low-power reduces body geometry and orbit segments. Shared resources are disposed exactly once; no dependencies, textures, postprocessing, timers or animation loops added.

## Final local verification / visual evidence
- **87 tests pass:** 45 Galaxy, 6 auth-runtime, 8 homepage DOM and 28 backend. Lint, production build, homepage route isolation and whitespace checks pass. No homepage/backend/dependency source changes.
- New checks cover every skill, invalid/in-flight selection, pointer/keyboard hover precedence, stable camera transitions, retarget reset, frozen/bounded orbits, hidden picking, reduced resource cost/disposal, SVG clicks and full orbital-path projection at desktop/mobile sizes in normal/reduced motion.
- Inspected actual fallback SVG at desktop stages 1360×800 and 1200×800, plus mobile 346×320 (viewport targets 1440×900, 1280×800, 390×844). Enlarged mobile framing after inspection. This verifies fallback artwork/composition only, not full-page layout, GPU appearance or touch. Some nodes naturally pass behind the body; the directory exposes all ten.
- Browser restriction established earlier in this same session remains unresolved; did not repeat blocked navigation or attempt protected Vercel access. Browser console and full-page HUD/overflow acceptance remain outstanding.
- Focused Skills adds 120 rendered mesh triangles and 13 potential draw submissions (10 satellites, 3 paths). Full system: 18,360 desktop / 6,680 low-power triangles in Skills view; overview remains 18,240 / 6,560. GPU frame time is unmeasured.
- Final gzip: Galaxy route 10.26 kB, deferred scene 139.12 kB, Galaxy CSS 3.11 kB. Homepage route isolation passes; existing deferred >500 kB warning remains.

## Visual experiment — Sun + Projects (2026-09-28)
- Retained the G1–G6 scene, navigation, orbit clocks, visibility pause, reduced-motion behavior, fallback and responsive composition. No new planet content, moons, routes or camera behavior.
- Added fine granulation and subdued darker channels to the desktop Sun shader; the low-power shader keeps its existing two-octave path and corona count.
- Projects receives one original fictional rocky-surface image asset in desktop (1536×768, 280 KiB) and mobile (768×384, 72 KiB) WebP tiers. Prompt direction: equirectangular diffuse basalt/ironstone map with eroded ridges and basins, warm copper sediment, no prepainted planet lighting or lettering. Built-in image generation produced the source; checked the resulting map visually. The browser loads the map lazily; the existing procedural surface remains while loading or if it fails. A very light bump response and slow deterministic axial rotation add relief without changing the orbit or camera.
- Loaded textures are owned by scene disposal. An outstanding asynchronous load cannot update a disposed scene. Asset readiness invalidates the shared render loop, including reduced-motion mode. No new package, extra loop or global postprocessing.
- Measured left/right pixel differences in both generated maps (mean channel gap 14–15 of 255, with localized larger gaps). A Projects-only albedo shader blends the opposite edge across the outer 2.5% of each longitude, giving both sides of the join identical color without modifying the source asset or affecting other planets. The height/bump sampling still uses the original image; GPU appearance of the join requires real-browser review.
- Baseline `master` was clean at `a4885a6`; created `feat/galaxy-cinematic-surface-spike` before edits. Frontend lint, 47 Galaxy tests, 8 homepage tests, 6 auth-runtime tests, 28 backend tests, production build and homepage route-isolation gate pass. Static image assets are present in the production build. Draft PR #3 seam-follow-up code commit `553d8ff` passed CI run `36448206051` and Vercel deployment status. No runtime browser/GPU or final desktop/mobile composition acceptance: supported browser rejects local preview with `ERR_BLOCKED_BY_CLIENT`; actual seam appearance and frame time remain unmeasured.
- **Decision:** keep this as a reviewable experiment off `master`; inspect a real 1440×900 and 390×844 WebGL session or user screenshots before merging/propagating the asset workflow to Identity, Skills and Journey. In particular, verify the generated map's longitude seam as Projects rotates. Do not call this visual acceptance or G7 completion.

## Previous publication
G6 published: content/selection `cc26b3c`, satellite/fallback implementation `4f014cb30e9073c46ed208dfee62b9b3bce682b1`. Frontend CI `36440847121`: **success**. Vercel preview status: **success**. PR **#2** merged G2–G6 into `master` at `2ba08baedb182e4cfdc2d40c59c1a9eaf2ba0d6b`. PR CI `36441658241` and post-merge CI `36441741414`: **success**; merged-commit Vercel deployment status: **success**. Source branch preserved. No G7 implementation. Complete browser/GPU acceptance when access is available; deployment success does not establish visual acceptance.

## Known limits / branch hygiene
Actual browser console, GPU appearance/frame rate, full-page layout/overflow and physical touch remain unverified. Existing large deferred Three.js chunk warning remains. The merged `refactor/backend-focused-homepage` branch can be removed only with user approval; no branches deleted. **Next: visual acceptance of the Sun + Projects experiment; G7 remains deferred.**
