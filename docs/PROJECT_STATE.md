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

## Phase verification
- 27 Galaxy tests and lint pass after this phase. New coverage: arrival-gated Core content, rapid Core/Identity/Core/Projects changes, fallback content and return, keyboard focus restoration, fresh entry, desktop/mobile projection, reduced motion and reset after retarget.
- Baseline production build/route isolation passed. G4 final build, Sun rendering checks, full regression suite and available visual inspection are next.

## Next phase / risks
Upgrade only the Sun's procedural surface and restrained hover/focus corona; preserve existing point light and ambient fill. Keep low-power work bounded and all effects inside the current loop. Then complete automated checks and available visual evidence. Actual browser/GPU performance, shaders, console and full-page responsive acceptance remain outstanding.

## Stop boundary
No G4 merge or production deployment. Existing branch contains unmerged G2/G3/G4 work and must be preserved. **Ready for G5: NO.**
