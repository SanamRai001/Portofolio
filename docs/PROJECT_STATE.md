# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration. Preserve the real backend lab and Forge companion while introducing motion and 3D in small, measurable phases.

## Current authoritative branch
`master`

Active development branch: `feat/immersive-system-phase-3`

## Completed phases

### Forge living portfolio
- Backend-focused portfolio redesign, Forge companion, backend lab, project presentation, observability console, auth overlay, and existing API contracts are preserved.

### Phase 1 — Motion foundation
- Merged to `master` at `16048d8 feat: establish immersive motion foundation`.
- GSAP 3.15.0, shared motion tokens, reduced-motion handling, scoped cleanup, and hero entrance.
- Vercel passed before merge.

### Phase 2 — System Core prototype
- Merged to `master` at `b483bd6 feat: prototype interactive system core`.
- Three.js 0.186.0 System Core representing API/auth/cache/database/runtime.
- Pointer response, request pulses, capped DPR, compact-device reductions, off-screen pause, static fallback, and full disposal.
- Vercel passed before merge.

## Active phase
**Phase 3 — Scroll architecture story**

### Added
- New architecture-story section immediately after the hero.
- One sticky System Core visual paired with five scroll chapters: API Core, Auth, Cache, Database, Runtime.
- GSAP ScrollTrigger tracks section progress and chapter activation without hijacking native scrolling.
- Scroll progress subtly opens the Three.js architecture rings.
- Active chapter increases emphasis on the relevant core/service node.
- Chapter copy uses restrained reveal transitions tied to viewport entry.
- Mobile removes sticky behavior and presents the story as a normal linear document.
- Reduced-motion users receive the full readable story with a static System Core and no reveal animation.
- No backend behavior or API contracts changed.

## Explicitly not included yet
- No backend-toggle-to-3D synchronization.
- No project-stack redesign.
- No page-wide WebGL background.
- No scroll hijacking.
- No Forge reaction integration.
- No audio, shaders, post-processing, or imported 3D models.

## Backend behavior preserved
Frontend contracts remain unchanged for:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file is modified in Phase 3.

## Existing observations
- The backend package still has no runnable automated test suite.
- `rateLimitMiddleware` exists but is not currently part of the project route middleware chain; this remains untouched.
- Backend CORS remains configured for production portfolio domains rather than localhost.
- Visual/browser review remains important before increasing interaction density.

## Next phase
**Phase 4 — Backend Lab visual synchronization**, if Phase 3 feels strong. Connect the real existing backend toggles to the System Core so auth/database/cache/logging state has an explanatory visual response without changing backend semantics.
