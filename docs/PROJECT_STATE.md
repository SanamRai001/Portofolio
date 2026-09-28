# PROJECT_STATE

## Objective / authorization
**G6 only — Skills planet**, authorized by “okay go to next phase” on 2026-09-28. Continue `feat/galaxy-g1-foundation`; do not rebuild, merge, delete branches or start G7.
Original Galaxy brief defines G6 as technology satellites, hover labels and selected-skill details. No proficiency percentages. Project moons/details, Journey and final Lab remain deferred.

## Baseline / prior decisions
- Clean local/fetched remote at G5 `5abae95`; G5 code `31b6148`, successful frontend CI `36439003234` and Vercel preview status. Master remains `70cb2dc`; G2–G5 unmerged.
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

## Publication / next step
Publish G6 commits on the existing branch, verify CI and stop. No G7 implementation, merge or production deployment. Complete browser/GPU acceptance when access is available.

## Known limits / branch hygiene
Actual browser console, GPU appearance/frame rate, full-page layout/overflow and physical touch remain unverified. Existing large deferred Three.js chunk warning remains. The merged `refactor/backend-focused-homepage` branch can be removed only with user approval; no branches deleted. **Ready for G7: NO.**
