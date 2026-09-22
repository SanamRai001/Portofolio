# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration. Preserve the real backend lab and Forge companion while introducing motion and 3D in small, measurable phases.

## Current authoritative branch
`master`

Active development branch: `feat/immersive-system-phase-1`

## Completed baseline
**Forge living portfolio UI — merged to master**

- Backend-focused portfolio redesign is live on `master`.
- Forge companion, backend lab, project presentation, observability console, auth overlay, and existing API contracts are preserved.
- Latest build fix on `master`: `e22e10b fix: use react-icons for GitHub brand icon`.

## Active phase
**Phase 1 — Motion foundation**

Scope is intentionally limited to the animation foundation. No Three.js scene is introduced in this phase.

### Added
- GSAP 3.15.0 as a frontend dependency with synchronized package-lock metadata.
- Shared `frontend/src/motion/index.js` registration and motion tokens for duration, easing, distance, and stagger.
- Shared `useReducedMotion` hook that reacts to OS preference changes and cleans up its media-query listener.
- Small CSS motion-token layer in `frontend/src/motion/motion.css`.
- A restrained GSAP hero entrance as a proof-of-life for the shared motion system.
- GSAP animation is scoped to the hero and reverted on cleanup, making it safe with React StrictMode.
- Users requesting reduced motion receive the existing static hero with no GSAP entrance.

## Explicitly not included yet
- No Three.js dependency.
- No WebGL canvas.
- No System Core.
- No ScrollTrigger-driven pinned chapters.
- No project-stack transition redesign.
- No backend-state-to-3D visualization.
- No Forge behavior changes.

## Backend behavior preserved
Frontend contracts remain unchanged for:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file is modified in Phase 1.

## Existing observations
- The backend package still has no runnable automated test suite.
- `rateLimitMiddleware` exists but is not currently part of the project route middleware chain; this remains untouched.
- Backend CORS remains configured for the production portfolio domains rather than localhost.
- Full cursor/mobile/backend-lab browser verification is still useful after each visual phase.

## Next phase
**Phase 2 — System Core prototype**

Create one isolated, performance-budgeted Three.js hero prototype representing API/auth/cache/database/runtime relationships. It should have a static/reduced-motion fallback and should not yet be wired into the rest of the page. Only continue into scroll storytelling if this prototype earns its complexity.
