# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration. Preserve the real backend lab and Forge companion while introducing motion and 3D in small, measurable phases.

## Current authoritative branch
`master`

Active development branch: `feat/immersive-system-phase-2`

## Completed phases

### Forge living portfolio
- Backend-focused portfolio redesign, Forge companion, backend lab, project presentation, observability console, auth overlay, and existing API contracts are preserved on `master`.

### Phase 1 — Motion foundation
- Merged to `master` at `16048d8 feat: establish immersive motion foundation`.
- Added GSAP 3.15.0, shared motion tokens, reduced-motion hook, scoped GSAP cleanup, and a restrained hero entrance.
- Phase 1 Vercel deployment passed before merge.

## Active phase
**Phase 2 — System Core prototype**

This phase intentionally adds one isolated Three.js visualization inside the existing hero engineering panel. It does not add scroll choreography or connect the 3D scene to backend toggles yet.

### Added
- Three.js 0.186.0 as the only new Phase 2 dependency.
- `SystemCore.jsx` with an API core connected to AUTH, CACHE, DATABASE, and RUNTIME nodes.
- Central core shell, three architecture rings, connection lines, lightweight request pulses, and a small deterministic particle field.
- Pointer-responsive depth on capable devices without OrbitControls or another interaction dependency.
- Rendering pauses when the core leaves the viewport.
- Device pixel ratio is capped at 1.6 desktop and 1.2 compact/coarse-pointer layouts.
- Geometry detail, antialiasing, and particle count are reduced for compact/coarse-pointer devices.
- ResizeObserver keeps renderer resolution scoped to the component rather than the window.
- Full Three.js geometry/material/renderer/context cleanup on React unmount.
- Static CSS topology fallback for reduced-motion users or unavailable WebGL.

## Explicitly not included yet
- No ScrollTrigger-pinned architecture chapter.
- No page-wide 3D background.
- No project-card 3D effects.
- No backend-toggle-to-System-Core synchronization.
- No Forge behavior changes.
- No sound, shaders, post-processing, GLB assets, or OrbitControls.

## Backend behavior preserved
Frontend contracts remain unchanged for:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file is modified in Phase 2.

## Existing observations
- The backend package still has no runnable automated test suite.
- `rateLimitMiddleware` exists but is not currently part of the project route middleware chain; this remains untouched.
- Backend CORS remains configured for the production portfolio domains rather than localhost.
- Browser-level visual judgment is important before expanding the System Core into a page-wide storytelling device.

## Next phase
If the prototype looks strong and performs well, **Phase 3 — scroll architecture story** will let GSAP ScrollTrigger progressively reveal and separate the same System Core into API/auth/cache/database/runtime chapters. If the prototype does not justify its cost, revise or remove it before Phase 3.
