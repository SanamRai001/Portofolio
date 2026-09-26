# PROJECT_STATE

## Objective / authorization
**G4 only — Core / Sun Identity**, explicitly requested in the user's 2026-09-26 brief. Extend `feat/galaxy-g1-foundation`; do not rebuild, merge, delete branches or start G5. Identity Planet content, satellites, moons, Journey and final Lab remain deferred.

## Inspected baseline
- Clean branch at `d5f5206`; final G3 code `876a9b3`. Freshly fetched remote branch matches local; master remains `70cb2dc`.
- G1–G3 source inspected: lazy route, preserved starfield/system, deterministic orbits, shared navigation, tracked camera, map, pointer/touch, Escape, reduced motion, fallback and disposal.
- Before G4: all 38 frontend tests (24 Galaxy, 6 auth, 8 homepage), lint and production build passed. No blocking code regression found.
- G1–G3 browser/GPU acceptance is still incomplete. Local preview fails `ERR_BLOCKED_BY_CLIENT`; protected Vercel redirects were rejected by automatic approval review, including after the ambiguous “continue” reply. No bypass or sign-in. User now explicitly authorizes G4 implementation; prior visual checks are not relabeled as passed.

## Completed phase — Core content and composition
- `data/core.js` is the single source for name, role, brand tagline, two concise statements, BIT/Nepal metadata and existing portfolio/GitHub links.
- Semantic `CoreIdentity` uses an h2 beneath the Galaxy h1. Open typography and a small guide line, no profile card. It is hidden/inert during approach and revealed after the shared controller reaches `body_focused` (380ms; immediate for reduced motion). No focus theft.
- Existing G3 `focusBody('core')`, retarget and return API retained. Sun hover says Core signal / Sanam Rai; map selection remains authoritative. Escape restores map focus when leaving Core links; other selections immediately remove stale Core content.
- Camera rig adds generic config-driven off-axis projection, eased by its existing flight clock. Desktop places the Sun left with 50% stage-height diameter; mobile gives it a dedicated 320px stage above content. Camera keeps the real focus anchor and safe travel altitude. Resize and retarget restore correct projection.
- Static fallback uses the same composition data and identity component; selected Core has a larger warm body, restrained surface contours and surrounding orbital context. No Three.js import is added to the DOM/fallback bundle.
- Layout retains native scrolling, semantic map controls and the existing single frame loop. No dependencies or postprocessing added.

## Completed phase — Sun rendering and feedback
- Sun surface now uses bounded, texture-free 3D value noise with slow domain distortion and a deep-amber/gold/ivory palette. Shader applies the renderer's tone/color-space transforms. Desktop uses three noise octaves; low-power uses two with fewer sphere segments.
- Hover and selection ease only the Sun's activity/corona uniforms. Focus increases corona strength by at most 16% and surface drift by 30%; the central point light and cool ambient fill are unchanged. Other bodies remain in the scene and their orbit lines dim through G3.
- Desktop retains two inexpensive corona shells; low-power has one. No particles, texture downloads, postprocessing, new dependencies or extra RAF loops.
- Pause/reduced motion freeze surface time and apply interaction feedback immediately; deselection restores base glow. Core's stage takes its natural content height to keep links clear of the system map at shorter desktop heights and enlarged text sizes.

## Final local verification
- **72 tests pass:** 30 Galaxy, 6 auth-runtime, 8 homepage DOM and 28 backend. Lint, production build and diff whitespace checks pass. New coverage: arrival-gated Core content, rapid Core/Identity/Core/Projects changes, fallback content and return, keyboard focus restoration, fresh entry, desktop/mobile projection, reduced motion and reset after retarget.
- Added Sun tests cover bounded/reversible activity, frozen surface time, rapid changes, low-power resource reduction/disposal and unchanged illumination/orbital behavior. Route isolation passes. Additional vertex-projection checks keep the actual Sun corona clear of screen edges, desktop copy and mobile return controls, including reduced motion.

## Visual evidence / performance
- Inspected actual selected-Core SVG output at stages 1360×630 (1440×900 viewport target), 1200×570 (1280×800) and 346×320 (390×844 mobile Sun region). This verifies fallback artwork/composition only, not the full browser layout or shader.
- Static inspection showed a background planet could compete with desktop copy; added a soft, pointer-transparent gradient behind the copy region, with no card boundary. Mobile keeps text below the canvas and does not need the gradient.
- Retried the supported local preview for G4: server starts, but browser navigation still fails `ERR_BLOCKED_BY_CLIENT`. Server stopped after inspection. No protected Vercel retry or access-control workaround.
- Full-page 1440×900 / 1280×800 / 390×844 HUD/overflow checks, GPU shader compilation/rendering, browser console, physical touch and actual frame stability remain unverified. JSDOM, numerical tests and build success do not replace these checks.
- G4 vs G3 gzip: Galaxy route 6.50 kB vs 5.34; deferred scene 137.83 kB vs 136.91; Galaxy CSS 2.22 kB vs 1.52. Homepage JS and CSS remain effectively unchanged; route guard excludes Galaxy/Three.js from homepage.
- Desktop geometry unchanged; low-power removes one Sun shell and one noise octave. No dependencies, downloaded textures, particles or additional animation loops. Existing >500 kB deferred scene warning remains. GPU performance is not measured.
- Motion.dev accessibility guidance informed the short reveal/reduced-motion treatment; implemented with existing hooks and CSS, without installing Motion.

## Publication / next step
Publish the reviewed G4 commits to the existing branch, then record CI/deployment results. Complete browser/GPU acceptance when authorized access is available. No backend or homepage source changes.

## Stop boundary
No G4 merge or production deployment. Existing branch contains unmerged G2/G3/G4 work and must be preserved. **Ready for G5: NO.**
